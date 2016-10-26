/**
 * Created by HongL on 2016/10/23.
 */

var com = require("./com.js");
//var SerialPort = com.SerialPort;
var logger = require('./log.js').logger;
var util= require('util');
var debug = require('debug')('bfsort');
var Emitter=require("events").EventEmitter;

var Command = require('./Command.js');
var sortDataDb = require('./models').sortdata;
var siteExitPortDb = require('./models').siteexitport;

var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var RECEIVE_TRIGGER = 0x08;
var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;
var defaults = {
  //reportVersionTimeout: 5000,
  receiveInterval: 100,
  delayTime : 3000,
  sendInterval:50,
  repeatSendTimes:3,	// 最多重发次数
  trashPort : "950|1",
  SerialPort: {
    baudRate: 57600,
    autoOpen: false,
    parity: 'none',
    xon: false,
    xoff: false,
    xany: false,
    rtscts: false,
    hupcl: true,
    dataBits: 8,
    stopBits: 1,
    parser:com.SerialPort.parsers.byteLength(11)
  }
};

function validDirect(direct){
  var totalSum = 0;
  for(var i =0 ;i<10;i++){
    totalSum += direct[i];
  }
  return (totalSum%256) == direct[10];
}

/*
 * Write Desination Port to Cart Board
 */
function DestPort(options, callback){
  if ("function" == typeof options || "undefined"== typeof options){
    callback = options;
    options = {};
  }

  if (!(this instanceof DestPort)){
    return new DestPort(options,callback);
  }

  Emitter.call(this);

  this.settings = Object.assign({}, defaults, options);
  this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

  this.opened = false;
  this.lastBuffer = new Buffer(INSTRUCTION_LENGTH);
  this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
  this.currentBuffer[0] = INSTRUCTION_HEADER;
  this.sameBufferCount = 0;
  this.receivedCount = 1;
  this.isAllowRecieved = false;

  this.parcel = null;
  this.sendBuffer = null;
  this.sendQueue = new Array();


  this.transport = new com.SerialPort(options.SerialName,this.settings.SerialPort);

  this.transport.on("close",function(){
    this.opened = false;
    this.emit("close")
  }.bind(this));

  //com port closed accidently,try open afterwards;
  this.transport.on("disconnect",function(){
    console.log("com port:"+ this.settings.SerialName +" is disconected");
    this.transport.close();
    this.opened = false;
    this.emit("disconnect");
    this.Init();
  }.bind(this));

  this.transport.on("error",function (error){
    if (!this.isReady && "function" == typeof callback){
      callback(error);
    }else{
      this.emit("error",error);
    }
  }.bind(this));

  this.transport.on('data',function(data){
    if (data && data.length>0){
      for (var i=0;i<data.length;i++){
        if(data[i] == INSTRUCTION_HEADER && this.isAllowRecieved == false){
          receivedCount = 1;
          this.isAllowRecieved = true;
        }else{
          if (this.isAllowRecieved) {
            this.currentBuffer[receivedCount++] = data[i];
            if (receivedCount == 11) {
              this.isAllowRecieved = false;
              this.recieveDirect();
            }
          }
        }
      }
    }
  }.bind(this));
}
DestPort.prototype = Object.create(Emitter.prototype,{
  constructor:{
    value:DestPort
  }
});

DestPort.prototype.Init=function(){
  //this.transport.close();
  this.transport.open(function (error){
    if (error){
      console.log("open com port "+this.settings.SerialName+" failed:"+error+".try again in 5 seconds");
      this.transport.opening = false;
      setTimeout(this.Init.bind(this),5000);
    }else{
      console.log("com port "+this.settings.SerialName+" opened successful");
      this.opened = true;
    }
  }.bind(this));

  this.ActualSendData();
  //todo
};

DestPort.prototype.recieveDirect= function(){
  var now = new Date();
  if (!this.currentBuffer.equals(this.lastBuffer)){
    this.sameBufferCount = 0;
    this.currentBuffer.copy(this.lastBuffer);
    util.print("\n");
    logger.info("\rReceive serial data:" + util.inspect(this.currentBuffer));
  }
  this.sameBufferCount++;
  util.print(now.toLocaleTimeString() +": count " +this.sameBufferCount+":"+ util.inspect(this.currentBuffer)+"\r");
  /*
   if (this.webResponse !== undefined){
   this.webResponse.send(util.inspect(this.currentBuffer));
   }
   */
  //logger.info("收到的指令:"+util.inspect(this.currentBuffer));
  if( !validDirect(this.currentBuffer)){
    util.print("指令校验失败:"+util.inspect(this.currentBuffer)+"\n");
    logger.error("指令校验失败:"+util.inspect(this.currentBuffer));
    return;
  }
  /*
  if (this.currentBuffer[1] == RECEIVE_TRIGGER){
    this.receiveTrigger();
  }
  */
};

DestPort.prototype.receiveTrigger = function() {
};


DestPort.prototype.savePackage = function(){
};

DestPort.prototype.isConnected = function(){
  return this.opened;
};

DestPort.prototype.GetStatus= function(cb,res){
  //todo
};

DestPort.prototype.QueueSend = function(buffer){
  this.sendQueue.push(buffer);
  //todo
};


DestPort.prototype.ActualSendData = function(){
  setTimeout(this.actualSendData.bind(this), this.settings.sendInterval);

  if (!this.opened)
    return;

  var now = Date.now();

  if (this.sendBuffer != null && this.sendBuffer !== undefined
     && now - this.sendBuffer.TriggerTime < this.settings.delayTime){
    this.transport.write(this.sendBuffer);
  }else{
    while (this.sendQueue.length > 0){
      this.sendBuffer = this.sendQueue.pop();
      if (this.sendBuffer != null && this.sendBuffer !== undefined
        && now - this.sendBuffer.TriggerTime < this.settings.delayTime){
        break;
      }
    }
  }
};

DestPort.prototype.SendDestDirection= function(parcel,destPort){
  var cmd = new Command(Command.PC_TO_ENTRY);
  cmd.enterPortID = parcel.EnterPort;
  cmd.serialNumer = parcel.SerialNumber;
  cmd.enterDirection = parcel.EnterDirection;

  var exitPort = parseInt(destPort.substr(0,destPort.indexOf('|')));
  var exitDirection = parseInt(destPort.substr(destPort.indexOf('|')+1));

  cmd.exitPortID = exitPort;
  cmd.exitDirection = exitDirection;

  cmd.MakeBuffer();
  var sendBuffer = cmd.buffer;
  sendBuffer.TriggerTime = parcel.TriggerTime;

  if (this.opened ){
    this.QueueSend(sendBuffer);
  }
  // todo:resend?
};

DestPort.prototype.enqueue = function(dest){
  var enterPort = dest.EnterPort;
  var serialNum = dest.SerialNumber;
  var enterDirection = dest.EnterDirection;

  if (dest.scanResult == "" || dest.scanResult == "0000"){
    this.SendDestDirection(dest,this.settings.trashPort);
  }

  var workingPort = this;

  sortDataDb.findOne({where:{packageBarcode:dest.scanResult}}).then(function(entry){
    if (entry == null) {
      logger.info("can't find barcode in database:"+dest.scanResult+",using trash port");
      workingPort.SendDestDirection(dest, workingPort.settings.trashPort);
    }else{
      var site=entry.packageSite;
      siteExitPortDb.findOne({where:{packageSite:site}}).then(function(siteExit) {
        if (siteExit == null) {
          workingPort.SendDestDirection(dest, workingPort.settings.trashPort);
          logger.error("receive site mapping not in definition: site " + site);
        } else {
          var destPort = siteExit.exitPort;
          if (destPort !== undefined) {
            workingPort.SendDestDirection(dest, destPort);
          }
        }
      }).catch(function (err){
        logger.error("database error in find sortData"+err);
      });
    }
  }).catch(function (err){
    logger.error("database error in find sortData"+err);
  });
};
module.exports = DestPort;