const net = require('net');
const util = require('util');
const Emitter=require('events').EventEmitter;
const logger = require('./log.js').logger;

var defaults = {
    //reportVersionTimeout: 5000,
    addr: "192.168.3.234",
    port: 5001,
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

function  Vitronic(options) {
    if (!(this instanceof Vitronic)){
        return new Vitronic(options);
    }
    Emitter.call(this);

    this.settings = Object.assign({}, defaults, options);
}


Vitronic.STX = 0x02;
Vitronic.ETX = 0x03;
Vitronic.CR = 0x0d;


Vitronic.prototype = Object.create(Emitter.prototype,{
    constructor:{
        value:Vitronic,
    }
});

Vitronic.prototype.Init = function (){
    this.addr = this.settings.addr;
    this.port = this.settings.port;
    this.stationID = this.settings.station;
    this.isConnected = false;
    this.packetID = 1;
    this.packetMapping = new Map();

    this.start();
};


Vitronic.prototype.start = function(){
    this.client = net.connect({host:this.addr,port:this.port},function(){
        this.isConnected = true;
        logger.info('conntect to vitronic server');
        this.heartBeat();
    }.bind(this));

    this.client.on('error',function(){
    });

    this.client.on('close',function(hadError){
        this.isConnected = false;
        this.client.end();
        logger.info("connection to vitronic server error,reconnectin 5 seconds");
        setTimeout(this.start.bind(this),5000);
    }.bind(this));

    this.client.on('data',function (data){
        this.readData (data);
    }.bind(this));

    this.client.on('end',function(){
        //this.isConnected = false;
        //logger.info('juxin disconnected');
    });
}

Vitronic.prototype.readData = function(data){
    if (data[0] != Vitronic.STX || data[data.length-1] != Vitronic.CR  || data[data.length-2] != Vitronic.ETX){
        logger.error('incorrect vitronic message format');
        return;
    }

    this.lastData = data;

    var str = data.toString('ascii',1,data.length-2);
    
    var resArr = str.split('|');

    if (resArr[0] == '30'){  //data response
	//data : '30|01|0000|00|01|14;test1610210019|321231010|X-0000|'
		this.emit('data',str);
        var readResult = {};
		readResult.str = str;
        readResult.tunnelID = resArr[1];
        readResult.packetID = resArr[2];
        readResult.unknown = resArr[3];
		readResult.barCodeNum = resArr[4];
        readResult.barCodes = resArr[5];
		readResult.volumeData = resArr[6];
        readResult.parcelCenter = resArr[7];
     
        readResult.barCodeArr = readResult.barCodes.split(';');
		console.log("scan result:"+str);
		logger.info(str);
        this.receiveScanResult(readResult);
        //todo
    }else if (resArr[0] == '40'){ //heartbeat response
        var tunnelID = resArr[1];
        var diagnostic = resArr[2];
        this.receiveHeartbeat(diagnostic);
    }
};

Vitronic.prototype.writeData = function(data){
    if (!this.isConnected){
        return false;
    }
    var buffStr = new Buffer(data,'ascii');
    var buffer = new Buffer(data.length +3);
    buffer[0] = Vitronic.STX;
    buffStr.copy(buffer,1);
    buffer[data.length + 1] = Vitronic.ETX;
    buffer[data.length + 2] = Vitronic.CR;

    this.client.write(buffer);
    return true;
};

//todo
Vitronic.prototype.receiveHeartbeat = function(diagnostic){
    //logger.info('receive heartbeat message:'+diagnostic);
    this.status = diagnostic;
};

Vitronic.prototype.heartBeat = function(){
    var heatBeatMsg = '40|'+this.stationID+'|00000000'
    this.writeData(heatBeatMsg);
    setTimeout(this.heartBeat.bind(this),15000);
};

Vitronic.prototype.sendIdentifier = function(packetID){
    if (packetID >= 10000){
        packetID = packetID%10000;
    }

    var idStr = packetID.toString();
    var idStr4 = pad('0000',idStr,true);
    var idStr10 = pad('0000000000',idStr,true);

    var identifierMsg = '20|'+this.stationID+'|'+idStr4+'|'+idStr10;
    this.writeData(identifierMsg);

	setTimeout(this.writeData.bind(this,identifierMsg),10);
	setTimeout(this.writeData.bind(this,identifierMsg),60);
	
};

Vitronic.prototype.enqueue = function(parcel){
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

Vitronic.prototype.checkBarCode=function(barCode){
    //todo:Check for correct barcode;
    return true;
};

/*
 * send scan result,check for time
 */
Vitronic.prototype.sendScanResult = function(result){
    this.emit("scan", result);
};

Vitronic.prototype.receiveScanResult = function(result){
    result.validBarCodes = [];
    for (var i=0;i<result.barCodeNum;i++){
		var codeLen = result.barCodeArr[2*i];
		var code = result.barCodeArr[2*i+1];
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

module.exports = Vitronic;