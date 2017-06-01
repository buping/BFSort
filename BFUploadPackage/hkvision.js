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

function  HKVision(options) {
  if (!(this instanceof HKVision)){
    return new HKVision(options);
  }
  Emitter.call(this);

  this.settings = Object.assign({}, defaults, options);
}


HKVision.STX = 0x02;
HKVision.ETX = 0x03;
HKVision.CR = 0x0d;
HKVision.LF = 0x0a;


HKVision.prototype = Object.create(Emitter.prototype,{
  constructor:{
    value:HKVision,
  }
});

HKVision.prototype.Init = function (){
  this.addr = this.settings.addr;
  this.port = this.settings.port;
  this.stationID = this.settings.station;
  this.isConnected = false;
  this.packetID = 1;
  this.packetMapping = new Map();
  this.start();
};


HKVision.prototype.start = function(){
  this.client = net.createServer(function(socket) {
    socket.on('data', function (data) {
      console.log(data.toString('ascii'));
      //console.log(util.inspect(data));

    });
    socket.on('end', function (data) {
      console.log('connection colosed');
    });
    socket.on('error', function (data) {
      console.log('connection error');
    });

  }).listen(7000);
  console.log('server started');
}

HKVision.prototype.readData = function(data){
  //console.log(data);
  if (data[0] != HKVision.STX || data[data.length-1] != HKVision.LF  || data[data.length-2] != HKVision.CR){
    logger.error('incorrect HKVision message format');
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

HKVision.prototype.writeData = function(data){
  if (!this.isConnected){
    return false;
  }
  var buffStr = new Buffer(data,'ascii');
  var buffer = new Buffer(data.length +3);
  buffer[0] = HKVision.STX;
  buffStr.copy(buffer,1);
  buffer[data.length + 1] = HKVision.ETX;
  buffer[data.length + 2] = HKVision.CR;

  this.client.write(buffer);
  return true;
};

//todo


HKVision.prototype.checkBarCode=function(barCode){
  //todo:Check for correct barcode;
  return true;
};

HKVision.prototype.enqueue = function(parcel){
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

HKVision.prototype.sendIdentifier = function(packetID){
  this.packetID = packetID;
};

/*
 * send scan result,check for time
 */
HKVision.prototype.sendScanResult = function(result){
  this.emit("scan", result);
};

HKVision.prototype.receiveScanResult = function(result){
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

module.exports = HKVision;


var test = new HKVision();
test.Init();