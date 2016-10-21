const net = require('net');
const util = require('util');
const Emitter=require('events').EventEmitter;
const logger = require('./log.js').logger;

var defaults = {
    //reportVersionTimeout: 5000,
    addr: "192.168.3.234",
    port: 5001,
    station: "01"
};

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
    console.log(util.inspect(data));
    logger.info(util.inspect(data));
    if (data[0] != Vitronic.STX || data[data.length-1] != Vitronic.CR  || data[data.length-2] != Vitronic.ETX){
        logger.info('incorrect vitronic message format');
        return;
    }

    this.lastData = data;

    var str = data.toString('ascii',1,data.length-2);
    var resArr = str.split('|');
    logger.info('message body:'+str);

    if (resArr[0] == '30'){  //data response
        var tunnelID = resArr[1];
        var packetID = resArr[2];
        var volumeData = resArr[3];
        var parcelCenter = resArr[4];
        var barCodeNum = resArr[5];
        var barCodes = resArr[6];

        var barCodeArr = barCodes.split(';');
        this.emit('data',barCodeArr);
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
    logger.info('receive heartbeat message:'+diagnostic);
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

    var identifierMsg = '20|'+this.stationID+'|'+idStr+'|0000000000';
    this.writeData(identifierMsg);
};


module.exports = Vitronic;