/**
 * Created by Administrator on 2016/8/4.
 */

var com = require("./com.js");
//var SerialPort = com.SerialPort;

var logger = require('./log.js').logger;
var util= require('util');
var debug = require('debug')('bfsort');
var bfstatus = require('./BFStatus.js');


var Emitter=require("events").EventEmitter;
var scanPackageDb = require('./models').eq_scanpackage;
var workingPort;

var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var RECEIVE_TRIGGER = 0x08;
var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;
var defaults = {
  //reportVersionTimeout: 5000,
  CartCount:100,
  CartWidth:0.6,
  receiveInterval: 100,
  sendInterval:500,
  repeatSendTimes:3,	// 最多重发次数
  SerialPort: {
    baudRate: 57600,
    autoOpen: false,
    parity: 'none',
    xon: false,
    xoff: false,
    xany: false,
    rtscts: false,
    hupcl: true,
    //   parser:com.SerialPort.parsers.byteLength(11),
    dataBits: 8,
    stopBits: 1
  }
};

function validDirect(direct){
  var totalSum = 0;
  for(var i =0 ;i<10;i++){
    totalSum += direct[i];
  }
  return (totalSum%256) == direct[10];
}

function TriggerPort(options, callback){
  if ("function" == typeof options || "undefined"== typeof options){
    callback = options;
    options = {};
  }

  if (!(this instanceof TriggerPort)){
    return new TriggerPort(options,callback);
  }

  Emitter.call(this);

  this.settings = Object.assign({}, defaults, options);
  this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

  this.isReady = true;
  this.portID = options.PortID;
  this.direction = options.Direction;
  this.opened = false;
  this.lastBuffer = new Buffer(INSTRUCTION_LENGTH);
  this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
  this.currentBuffer[0] = INSTRUCTION_HEADER;
  this.sameBufferCount = 0;
  this.receivedCount = 1;
  this.isAllowRecieved = false;
  this.lastSerialNum = 0;
  this.lastEnterPort = 0;
  this.packetID = 1;

  this.parcel = {};
  this.loadSucc = false;
  this.employeeName = "admin";
  this.cartAliveTime = new Array(this.settings.CartCount);
  this.railSpeed = 0;
  this.InitCartAlive();
  setInterval(this.CheckCartAlive.bind(this),5000);

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
      //console.log("got data,len is "+data.length);
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
TriggerPort.prototype = Object.create(Emitter.prototype,{
  constructor:{
    value:TriggerPort
  }
});

TriggerPort.prototype.Init=function(){
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
  //todo
};

TriggerPort.prototype.recieveDirect= function(){
  if( !validDirect(this.currentBuffer)){
    //logger.error("指令校验失败:"+util.inspect(this.currentBuffer));
    return;
  }


  var now = new Date();
  if (!this.currentBuffer.equals(this.lastBuffer)){
    this.sameBufferCount = 0;
    this.currentBuffer.copy(this.lastBuffer);
    console.log("trigger:" + util.inspect(this.currentBuffer));
    logger.info("trigger:" + util.inspect(this.currentBuffer));

    if (this.currentBuffer[1] == RECEIVE_TRIGGER){
      this.receiveTrigger();
    }
  }
  /*
   }else {
   this.sameBufferCount++;
   //util.print(now.toLocaleTimeString() + ": count " + this.sameBufferCount + ":" + util.inspect(this.currentBuffer) + "\r");
   }
   */
  /*
   if (this.webResponse !== undefined){
   this.webResponse.send(util.inspect(this.currentBuffer));
   }
   */
  //logger.info("收到的指令:"+util.inspect(this.currentBuffer));
};

TriggerPort.prototype.receiveTrigger = function() {
  var currentBuffer = this.currentBuffer;
  var parcel = {};
  parcel.ExitPort = currentBuffer[2] + currentBuffer[3] * 256;
  parcel.EnterPort = currentBuffer[4];
  parcel.SerialNumber = currentBuffer[5] + currentBuffer[6] * 256;
  parcel.EnterDirection = (currentBuffer[8] & 0x02) / 2;
  parcel.ExitDirection = currentBuffer[8] % 2;

  parcel.CartID = currentBuffer[7];

  this.CalSpeed(parcel.CartID);
  //packetID,use cartID maybe;
  parcel.packetID = this.packetID;
  this.packetID++;
  if (this.packetID>=10000){
    this.packetID = 1;
  }
  this.respondStatus = currentBuffer[9];

  //this.parcel = parcel;

  /*
   if (parcel.EnterPort ==0 || parcel.SerialNumber ==0){
   return;
   }
   */

  /*
   if (parcel.SerialNumber == this.lastSerialNum && parcel.EnterPort == this.lastEnterPort){
   return;
   }
   */

  this.lastSerialNum = parcel.SerialNumber;
  this.lastEnterPort = parcel.EnterPort;


  parcel.TriggerTime = Date.now();
  //this.savePackage();
  this.emit('triggered',parcel);
};


TriggerPort.prototype.savePackage = function(parcel){

  parcel.IsSelect = "0";
  parcel.EmployeeName = this.employeeName;
  parcel.ScanType = "PZ";

  parcel.UploadDate = Date.now();

  scanPackageDb.create(parcel).then(function(ret){
    debug("saved parcel to datebase successful:"+util.inspect(ret));
  },function(err){
    debug("saved parcel to datebase failed:"+util.inspect(err));
  }).catch(function(err){
    logger.error("database error in savePackage.");
  });
};

TriggerPort.prototype.isConnected = function(){
  return this.opened;
};

TriggerPort.prototype.GetStatus= function(cb,res){
  //todo
  return this.respondStatus;
};

TriggerPort.prototype.InitCartAlive = function() {
  var now = Date.now();
  for (var i = 0; i < this.settings.CartCount; i++) {
    this.cartAliveTime[i] = now;
  }
  this.LastCartID = 1;
  this.LastTriggerTime = now;
  this.SpeedTimer = new Array();
};

TriggerPort.prototype.CheckCartAlive = function(){
  var now = Date.now();
  var elapsed = now - this.LastTriggerTime;
  if (elapsed > 3000){
    this.railSpeed = 0;
  }

  if (this.railSpeed==0){
    bfstatus.ReportSpeed(this.railSpeed);
    return;
  }

  var now = Date.now();

  for (var i = 0; i < this.settings.CartCount; i++) {
    var elapsed = (now - this.cartAliveTime[i])/1000;
    if (elapsed > 300){
      logger.info((i+1)+"号小车故障,请停机检修");
      bfstatus.ReportError(2,(i+1)+"号小车故障,请停机检修");
    }
  }
};

TriggerPort.prototype.CalSpeed = function(cartID){
  if (cartID <=0 || cartID> this.settings.CartCount)
    return;

  var now = Date.now();
  if (cartID>0 && cartID<= this.settings.CartCount)
    this.cartAliveTime[cartID-1] = now;

  var elapsed = now - this.LastTriggerTime;



  if (cartID == this.LastCartID || elapsed>800){
    this.railSpeed = 0;
    this.LastTriggerTime = now;
    this.LastCartID = cartID;

    return;
  }


  this.SpeedTimer.push(elapsed);

  this.LastTriggerTime = now;
  this.LastCartID = cartID;


  if (this.SpeedTimer.length >10){
    this.SpeedTimer.shift();
  }

  var totalTime = 0;
  for (var i=0;i<this.SpeedTimer.length;i++){
    totalTime+=this.SpeedTimer[i];
  }
  totalTime /= 1000;



  this.railSpeed = (this.settings.CartWidth*this.SpeedTimer.length)/totalTime;

  this.railSpeed = this.railSpeed.toFixed(3);
  console.log(this.railSpeed);
  bfstatus.ReportSpeed(this.railSpeed);
};


module.exports = TriggerPort;