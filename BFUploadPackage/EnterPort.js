/**
 * Created by Administrator on 2016/8/4.
 */

var com = require("./com");
//var SerialPort = com.SerialPort;

var log4js = require('log4js');
var logger = log4js.getLogger();
var util= require('util');

var Emitter=require("events").EventEmitter;

var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var INSTRUCTION_LENGTH = 11;
var defaults = {
    //reportVersionTimeout: 5000,
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
        dataBits: 8,
        stopBits: 1,
        bufferSize: 256
    },
};

var RESPONSE_FUNC = {};
RESPONSE_FUNC[RECEIVE_UPLOAD] = function (board){

}

function validDirect(direct){
    var totalSum = 0;
    for(var i =0 ;i<10;i++){
        totalSum += direct[i];
    }
    return (totalSum%256) == direct[10];
}

function EnterPort(options, callback){
    if ("function" == typeof options || "undefined"== typeof options){
        callback = options;
        options = {};
    }

    if (!(this instanceof EnterPort)){
        return new EnterPort(options,callback);
    }

    Emitter.call(this);

    this.settings = Object.assign({}, defaults, options);

    this.portID = options.PortID;
    this.direction = options.Direction;
    this.opened = false;
    this.isReady = false;
    this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.currentBuffer[0] = 0xAA;
    this.sendBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.sendBuffer[0] = 0xAA;
    this.receivedCount = 1;
    this.isAllowRecieved = false;

    this.package = null;
    this.loadDeviceId = 0;
    this.loadDirection = 0;
    this.loadSucc = false;
    this.isLoading = false;
    this.isSending = false;


    this.transport = new com.SerialPort(options.SerialName,this.settings.SerialPort);

    this.transport.on("close",function(){
        this.opened = false;
        this.emit("close")
    }.bind(this));

    this.transport.on("disconnect",function(){
        console.log("com port:"+port+" is disconected");
        this.emit("disconnect");
    }.bind(this));

    this.transport.on("error",function (error){
        if (!this.isReady && "function" == typeof callback){
            callback(error);
        }else{
            this.emit("error",error);
        }
    }.bind(this));

    this.transport.on('data',function(data){
        logger.info("Receive serial data:" + util.inspect(data));

        if (data && data.length>0){
            for (var i=0;i<data.length;i++){
                if(data[i] == 0xAA && isAllowRecieved == false){
                    receivedCount = 1;
                    isAllowRecieved = true;
                }else{
                    if (isAllowRecieved) {
                        currentBuffer[receivedCount++] = data[i];
                        if (receivedCount == 11) {
                            isAllowRecieved = false;
                            this.recieveDirect();
                        }
                    }
                }
            }
        }
    }.bind(this));
}
EnterPort.prototype = Object.create(Emitter.prototype,{
    constructor:{
        value:EnterPort,
    }
});

EnterPort.prototype.Init=function(){
    this.transport.open(function (error){
        if (error){
            logger.log("open com port "+port+" failed.try again in 5 seconds");
            setTimeout(this.serialport.open,5000);
        }else{
            this.opened = true;
            this.isReady = true;
        }
    });
    //todo
}

EnterPort.prototype.recieveDirect= function(){
    logger.info("收到的指令:"+util.inspect(this.currentBuffer));
    if( !validDirect(board.currentBuffer)){
        logger.error("指令校验失败");
        return;
    }
    if (currentBuffer[1] == RECEIVE_UPLOAD){
        this.receiveUpload();
    }
}

EnterPort.prototype.receiveUpload = function(){
    var respondExitPort = currentBuffer[2] + currentBuffer[3] * 256;
    var respondEnterPort = currentBuffer[4];
    var respondSerialNum = currentBuffer[5] + currentBuffer[6] * 256;
    var respondEnterDirection = currentBuffer[8] % 2;
    var respondExitDirection = currentBuffer[8] / 2;
    var respondStatus = currentBuffer[9];
    if (respondExitPort == package.exitPort && respondEnterPort == package.enterPort
        && respondSerialNum == package.serialNum && respondEnterDirection == package.enterDirection
        && respondExitDirection == package.exitDirection && respondStatus == 0x00){
        this.loadSucc = true;
        this.isSending = false;
        this.emit('loaded');
    }
}

EnterPort.prototype.sendPackage = function(postPackage) {
    this.loadSucc =false;
    this.package = postPackage;
    sendBuffer[0] = 0xAA;
    sendBuffer[1] = 0x01;
    sendBuffer[2] = package.exitPort % 256;
    sendBuffer[3] = package.exitPort / 256;
    sendBuffer[4] = package.enterPort % 256;
    sendBuffer[5] = package.serialNum % 256;
    sendBuffer[6] = package.serialNum / 256;
    sendBuffer[7] = 0x00;
    sendBuffer[8] = package.enterDirection * 2 + package.exitDirection;
    sendBuffer[9] = 0x00;
    var totalSum = 0;
    for(var i = 0;i<10;i++){
        totalSum += direct[i];
    }
    sendBuffer[10] = totalSum%256;

    this.isSending = true;
    this.actualSendData();
}

EnterPort.prototype.actualSendData = function() {
    if (! this.loadSucc){
        this.serialport.write(sendBuffer);
        setTimeout(this.actualSendData.bind(this),this.settings.sendInterval);
    }
}

EnterPort.prototype.enqueue = function(fjData){
    if (this.isLoading){
        return false;
    }
}

EnterPort.prototype.isConnected = function(){
    return this.opened;
}

EnterPort.prototype.GetStatus= function(cb){
    return this.workingStatus;
}

module.exports = EnterPort;