const net = require('net');
const util = require('util');
const Emitter=require('events').EventEmitter;
const logger = require('./log.js').logger;

var defaults = {
  //reportVersionTimeout: 5000,
  addr: "172.24.24.1",
  port: 51236,
  station: "01",
  maxTriggerDelay: 4000,   //max ms for scan result after trigger is received
  minTriggerDelay:1000 //ms for trigger->dest delay
};

function pad(pad,str,padLeft){
  if (typeof str === 'undefined'){
    return pad;
  }
  if (padLeft){
    return (pad+str).slice(-pad.length);
  }else{
    return (str+pad).substring(0,pad.length);
  }
}

function  Datalogic(options) {
  if (!(this instanceof Datalogic)){
    return new Datalogic(options);
  }
  Emitter.call(this);

  this.settings = Object.assign({}, defaults, options);
}


Datalogic.STX = 0x02;
Datalogic.ETX = 0x03;
Datalogic.CR = 0x0d;
Datalogic.LF = 0x0a;


Datalogic.prototype = Object.create(Emitter.prototype,{
  constructor:{
    value:Datalogic,
  }
});

Datalogic.prototype.Init = function (){
  this.addr = this.settings.addr;
  this.port = this.settings.port;
  this.stationID = this.settings.station;
  this.isConnected = false;
  this.packetID = 1;
  this.packetMapping = new Map();
  this.start();
};


Datalogic.prototype.start = function(){
  this.client = net.connect({host:this.addr,port:this.port},function(){
    this.isConnected = true;
    logger.info('conntect to Datalogic server');
  }.bind(this));

  this.client.on('error',function(){
  });

  this.client.on('close',function(hadError){
    this.isConnected = false;
    this.client.end();
    logger.info("connection to Datalogic server error,reconnectin 5 seconds");
    setTimeout(this.start.bind(this),5000);
  }.bind(this));

  this.client.on('data',function (data){
	//console.log("datalogic:"+data);
    this.readData (data);
  }.bind(this));

  this.client.on('end',function(){
    //this.isConnected = false;
    //logger.info('juxin disconnected');
  });
}

Datalogic.prototype.readData = function(data){
  //console.log(data);
  if (data[0] != Datalogic.STX || data[data.length-1] != Datalogic.LF  || data[data.length-2] != Datalogic.CR){
    logger.error('incorrect Datalogic message format');
    return;
  }

  this.lastData = data;

  var str = data.toString('ascii',1,data.length-2);
  this.emit('data',str);

  var readResult = {};
  if (str == 'Noread'){
    readResult.barCodeNum = 0;
    readResult.barCodeArr = [];
    readResult.resultStr = str;
  }else{
	console.log("datalogic got barcode:"+str);
	logger.info("valid datalogic data:" + str);
    var allCodes = str.split(';');
    readResult.barCodeNum = allCodes.length;
    readResult.barCodeArr = allCodes;
    readResult.resultStr = str;
  }
  this.receiveScanResult(readResult);
};

Datalogic.prototype.writeData = function(data){
  if (!this.isConnected){
    return false;
  }
  var buffStr = new Buffer(data,'ascii');
  var buffer = new Buffer(data.length +3);
  buffer[0] = Datalogic.STX;
  buffStr.copy(buffer,1);
  buffer[data.length + 1] = Datalogic.ETX;
  buffer[data.length + 2] = Datalogic.CR;

  this.client.write(buffer);
  return true;
};

//todo


Datalogic.prototype.checkBarCode=function(barCode){
  //todo:Check for correct barcode;
  return true;
};

Datalogic.prototype.enqueue = function(parcel){
  //this.packetMapping.set(this.packetID,parcel);
  this.sendIdentifier(parcel.packetID);
  logger.info("send packet id "+parcel.packetID+" for parcel:"+parcel.SerialNumber+","+parcel.EnterPort);
  //resend after 100 ms
  /*
   this.packetID++;
   if (this.packetID >= 10000){
   this.packetID = 1;
   }
   */
};

Datalogic.prototype.sendIdentifier = function(packetID){
  this.packetID = packetID;
};

/*
 * send scan result,check for time
 */
Datalogic.prototype.sendScanResult = function(result){
  this.emit("scan", result);
};

Datalogic.prototype.receiveScanResult = function(result){
  result.validBarCodes = [];
  result.packetID = this.packetID;
  for (var i=0;i<result.barCodeNum;i++){
    var code = result.barCodeArr[i];
    if (this.checkBarCode(code)){
      result.validBarCodes.push(code);
    }
  }
  this.sendScanResult(result);

  /*
   var now = Date.now();
   var maxTriggerDelay = this.settings.maxTriggerDelay;
   var vitro = this;
   this.packetMapping.forEach(function(value,key,map){
   var elipseTime = now - value.TriggerTime;
   if (elipseTime > maxTriggerDelay){
   map.delete(key);
   }
   });

   if (packetID != 0) {
   var dest = this.packetMapping.get(packetID);
   if (dest !== undefined) {
   this.packetMapping.delete(packetID);
   dest.scanResult = barCode;
   this.sendScanResult(dest);
   logger.info("scan result found in map by packetID:"+util.inspect(dest));
   } else {
   logger.error("receive packetID not in map:" + packetID + ",scan result:"+barCode);
   }
   }else{
   var found = false;
   var vitro = this;
   this.packetMapping.forEach(function(value,key,map){
   var elapsed = now-value.TriggerTime;
   if (!found  && elapsed<vitro.settings.maxTriggerDelay && elapsed>vitro.settings.minTriggerDelay) {
   found = true;
   value.scanResult = barCode;
   vitro.sendScanResult(value);
   logger.info("scan result found in map by shift:"+util.inspect(value));
   map.delete(key);
   }
   });
   }
   */
};

module.exports = Datalogic;

var test = new Datalogic();