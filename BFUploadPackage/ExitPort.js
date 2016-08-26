var com = require("./com");

var log4js = require('log4js');
var logger = log4js.getLogger();
var util= require('util');

var Emitter=require("events").EventEmitter;


var INSTRUCTION_LENGTH = 11;
var defaults = {
    //reportVersionTimeout: 5000,
    exitInterval: 1000,
    //sendInterval:500,
    //repeatSendTimes:3,	// 最多重发次数
    serialport: {
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
        bufferSize: 256
    },
};

function ExitPort(port, options, callback){
    if ("function" == typeof options || "undefined"== typeof options){
        callback = options;
        options = {};
    }

    if (!(this instanceof ExitPort)){
        return new ExitPort(port,options,callback);
    }

    this.queryBoards = new Array();

    this.isReady = false;
    this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.currentBuffer[0] = 0xAA;
    this.sendBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.sendBuffer[0] = 0xAA;
    this.receivedCount = 1;
    this.isAllowRecieved = false;

    if ("object" == typeof port){
        this.transport = port;
    }else{
        this.transport = new com.SerialPort(port,this.settings.serialport,false);
    }
}

ExitPort.prototype.QueryOneTime = function(){

};

module.exports = ExitPort;


