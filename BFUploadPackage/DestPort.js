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
var scanPackageDb = require('./models').eq_scanpackage;
var scanFeedback = require('./ScanFeedback.js');
var bfstatus = require('./BFStatus.js');
var searchBarcode = require('./SearchBarcode.js');

var ylhd = require('./client/ylhd.js');


var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var RECEIVE_TRIGGER = 0x08;
var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;
var defaults = {
  //reportVersionTimeout: 5000,
  receiveInterval: 100,
  delayTime : 1800,
  minDelay : 1500,
  sendInterval:50,
  repeatSendTimes:3,	// 最多重发次数
  trashPort : "999|1",
  SerialPort: {
    baudRate: 57600,
    autoOpen: false,
    parity: 'none',
    xon: false,
    xoff: false,
    xany: false,
    rtscts: false,
    hupcl: true,
    //parser:com.SerialPort.parsers.byteLength(11)
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

  this.packetMapping = new Map();
  this.currentPacketID = 0;


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
  if( !validDirect(this.currentBuffer)){
    //logger.error("指令校验失败:"+util.inspect(this.currentBuffer));
    return;
  }

  var now = new Date();
  if (!this.currentBuffer.equals(this.lastBuffer)){
    this.sameBufferCount = 0;
    this.currentBuffer.copy(this.lastBuffer);
    //util.print("\n");
    logger.info("read destport data:" + util.inspect(this.currentBuffer));
    if (this.currentBuffer[5] !=0 || this.currentBuffer[6] !=0){
      console.log("read destport data:" + util.inspect(this.currentBuffer));
    }
  }
  this.sameBufferCount++;
  //util.print(now.toLocaleTimeString() +": count " +this.sameBufferCount+":"+ util.inspect(this.currentBuffer)+"\r");
  /*
   if (this.webResponse !== undefined){
   this.webResponse.send(util.inspect(this.currentBuffer));
   }
   */
  //logger.info("收到的指令:"+util.inspect(this.currentBuffer));
  /*
   if (this.currentBuffer[1] == RECEIVE_TRIGGER){
   this.receiveTrigger();
   }
   */
};

DestPort.prototype.receiveTrigger = function() {
};


DestPort.prototype.savePackage = function(parcel){
  parcel.IsSelect = "0";
  parcel.EmployeeName = "admin";
  parcel.ScanType = "PZ";

  parcel.UploadDate = Date.now();


  scanPackageDb.create(parcel).then(function(ret){
    debug("saved parcel to datebase successful:"+util.inspect(ret));
  },function(err){
    debug("saved parcel to datebase failed:"+util.inspect(err));
  }).catch(function(err){
    logger.error("database error in savePackage.");
  });

  if (parcel.TrackNum !== undefined && parcel.TrackNum !== null && parcel.TrackNum !=""){
    scanFeedback(parcel.TrackNum);
  }

  if (parcel.TrackNum !== undefined && parcel.TrackNum !== null && parcel.TrackNum !=""){
    bfstatus.RealtimeScan(0,parcel.TrackNum+parcel.ChannelCode);
  }else{
    var volumeData = parcel.volumeData;
    if (volumeData == undefined || volumeData == null)
      volumeData = "";
    var height = parseInt(volumeData.substr(6,3));
    if (height>15){
      var msg={};
      msg.id = parcel.packetID;
      msg.scan = parcel.scanResult;
      bfstatus.RealtimeScan(2,JSON.stringify(msg));
    }else{
      bfstatus.RealtimeScan(1,'empty cart');
    }

  }

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
  setTimeout(this.ActualSendData.bind(this), this.settings.sendInterval);

  if (!this.opened)
    return;

  var now = Date.now();

  if (this.sendBuffer != null && this.sendBuffer !== undefined
    && now - this.sendBuffer.TriggerTime < this.settings.delayTime){

    this.transport.write(this.sendBuffer.rewriteBuffer);
  }else{
    for (var [nextParcelID,nextParcel] of this.packetMapping){
      if (nextParcel === undefined || nextParcel === null){
        this.packetMapping.delete(nextParcelID);
      }else if (now - nextParcel.TriggerTime > this.settings.delayTime){
        this.packetMapping.delete(nextParcelID);
      }else if (now - nextParcel.TriggerTime < this.settings.delayTime && now - nextParcel.TriggerTime > this.settings.minDelay) {
        if (nextParcel.destPort != null && nextParcel.destPort != undefined) {
          this.sendBuffer = nextParcel;
          this.MakeRewriteBuff();
          logger.info("send rewrite buffer:" + util.inspect(this.sendBuffer.rewriteBuffer));
          this.transport.write(this.sendBuffer.rewriteBuffer);
        }
        this.packetMapping.delete(nextParcelID);
        break;
      }
    }
  }
};

DestPort.prototype.MakeRewriteBuff= function(){
  var parcel = this.sendBuffer;
  var destPort = parcel.destPort;
  var now = Date.now();

  //not receive vitronic response in time
  if (destPort === undefined || destPort === null) {
    destPort = this.settings.trashPort;
    parcel.Logs = "receive no vitronic response";
	
	  console.log("got no response in time");
  }

  logger.info("send parcel "+parcel.packetID+" to port "+destPort);

  var exitPort = parseInt(destPort.substr(0,destPort.indexOf('|')));
  var exitDirection = parseInt(destPort.substr(destPort.indexOf('|')+1));

  parcel.ExitPort = exitPort;
  parcel.ExitDirection = exitDirection;
  //parcel.TrackNum = parcel.scanResult;

  var cmd = new Command(Command.PC_TO_ENTRY);
  cmd.enterPortID = parcel.EnterPort;
  cmd.serialNumber = parcel.SerialNumber;
  cmd.enterDirection = parcel.EnterDirection;

  cmd.exitPortID = exitPort;
  cmd.exitDirection = exitDirection;
  cmd.reserved = parcel.CartID;

  cmd.MakeBuffer();
  parcel.rewriteBuffer = cmd.buffer;

  this.savePackage(parcel);
  // todo:resend?
};

DestPort.prototype.receiveScan = function(result){
  var id = parseInt(result.packetID);
  if (id == 0) {
    id = this.currentPacketID+1;
    if (id>=10000){
      id = 1;
    }
    logger.info("fusion faile,using guess packetID:"+id);
  }

  this.currentPacketID = id;

  var dest = this.packetMapping.get(id);
  if (dest === undefined || dest === null) {
    logger.error("packetID "+ result.packetID +" not found in packetMap");
    return;
  }

  dest.scanResult = result.validBarCodes;
  dest.volumeData = result.volumeData;
  //this.findExitPort(dest);
  this.GetExitPortOnline(dest);
};

DestPort.prototype.GetExitPortOnline = function(dest){
	var workingPort = this;
  if (dest.scanResult.length ==0) {
    dest.Logs = "Scan return 0 elements";
    return;
  }
  dest.destPort = "999|1";

  /*
  logger.info("get ylhd package:"+dest.scanResult[0]);
  dest.TrackNum = dest.scanResult[0];

  ylhd.getPackageInfo(dest.scanResult[0],function (data) {
    if (data.success && data.map.dest != undefined){
      var mapdest = data.map.dest;
      if (mapdest.printArea){
        logger.info('Exitport is '+ mapdest.printArea + 'for package:'+dest.TrackNum);
		dest.destPort = mapdest.printArea;
		dest.CountryCode = mapdest.destCode;
		dest.ChannelCode = mapdest.channel;
      }else{
		dest.destPort = workingPort.settings.trashPort;
        logger.info("server return no exitport for barcode:"+dest.TrackNum);
      }

    }else{
		dest.destPort = workingPort.settings.trashPort;
      logger.info("server return no exitport for barcode:"+dest.TrackNum);		
    }
  });
  */

  for (let oneBarcode of dest.scanResult){
    logger.info("get ylhd package:"+oneBarcode);
    ylhd.getPackageInfo(oneBarcode,function(data){
      if (data != null && data != undefined) {
        logger.info('server1 return Exitport '+ data + ' for package:'+oneBarcode);
        dest.destPort = data;
        dest.ChannelCode = "server1";
      }else{
        logger.info("server1 return no exitport for barcode:"+oneBarcode);
      }
    });

    ylhd.getPackageInfoExtra(oneBarcode,function(data){
      if (data != null && data != undefined) {
        logger.info('server2 return Exitport '+ data + ' for package:'+oneBarcode);
        if (dest.destPort == "999|1"){
          dest.destPort = data;
          dest.ChannelCode = "server2";
          logger.info('server1 no result,using server2 result:'+data);
        }
      }else{
        logger.info('server2 return no result for barcode:'+oneBarcode);
      }
    });
  }


};

DestPort.prototype.tryOnlineSearch = function(dest){
  var workingPort = this;
  for (let oneBarcode of dest.scanResult){
    searchBarcode(oneBarcode,function(site){
      dest.TrackNum = oneBarcode;
      dest.Logs = oneBarcode + " found using online search";
      workingPort.findOutPort(dest,site);
    });
  }
};

DestPort.prototype.findOutPort = function(dest,site){
  var defaultPort  = this.settings.trashPort;
  siteExitPortDb.findOne({where:{packageSite:site}}).then(function(siteExit) {
    if (siteExit == null) {
      dest.destPort = defaultPort;
      dest.Logs = "siteExitPort find no result:"+site;
      logger.error("receive site mapping not in definition: site " + site);
    } else {
      var destPort = siteExit.exitPort;
      if (destPort !== undefined) {
        dest.destPort = destPort;
        dest.ChannelCode = siteExit.siteName;
      }else{
        dest.destPort = defaultPort;
      }
    }
  }).catch(function (err){
    logger.error("database error in find site:"+err);
  });
};

DestPort.prototype.findExitPort = function(dest){
  var workingPort = this;

  if (dest.scanResult.length ==0) {
    dest.Logs = "Scan return 0 elements";
    dest.destPort = workingPort.settings.trashPort;
    return;
  }

  logger.info("find in sortData for scan result:"+util.inspect(dest.scanResult));
  
  
  sortDataDb.findOne({where:{packageBarcode:dest.scanResult}}).then(function(entry){
    if (entry == null) {
      logger.info("can't find barcode in database:"+dest.scanResult+",try online search");
      dest.Logs = "invalid scan result:"+util.inspect(dest.scanResult);
      dest.destPort = workingPort.settings.trashPort;
      workingPort.tryOnlineSearch(dest);
    }else{
      var site=entry.packageSite;
      dest.TrackNum = entry.packageBarcode;
      workingPort.findOutPort(dest,site);
    }
  }).catch(function (err){
    logger.error("database error in find sortData:"+err);
  });
  
};

DestPort.prototype.enqueue = function(parcel){
  this.packetMapping.set(parcel.packetID,parcel);
};

module.exports = DestPort;