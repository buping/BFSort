/**
 * Created by Administrator on 2016/8/4.
 */

var com = require("./com");
var SerialPort = serial.SerialPort;

var log4js = require('log4js');
var logger = log4js.getLogger();
var util= require('util');

var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var INSTRUCTION_LENGTH = 11;
var defaults = {
	//reportVersionTimeout: 5000,
	receiveInterval: 100,
	repeatSendTimes:3,	// 最多重发次数
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

function UploadMotor(port,options,callback){
	if ("function" == typeof options || "undefined"== typeof options){
		callback = options;
		options = {};
	}

    this.settings = Object.Assign({}, defaults, options);
    this.opened = false;
    this.isReady = false;
    this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
	this.currentBuffer[0] = 0xAA;
	this.receivedCount = 1;
     this.isAllowRecieved = false;

    this.package = null;
    this.loadDeviceId = 0;
    this.loadDirection = 0;
    
    if ("object" == typeof port){
        this.transport = port;
    }else{
        this.transport = new com.SerialPort(port,this.settings.serialport,false);
    }

    this.transport.on("close",function(){
        this.opened = false;
        this.emit("close")
    }).bind(this);

    this.transport.on("disconnect",function(){
        console.log("com port:"+port+" is disconected");
        this.emit("disconnect");
    }).bind(this);

    this.transport.on("error",function (error){
        if (!this.isReady && "function" == typeof callback){
            callback(error);
        }else{
            this.emit("error",error);
        }
    }).bind(this);

    this.serialport.on('data',function(data){
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
    });
}

UploadMotor.prototype.Init=function(){
    this.transport.open(function (error){
        if (error){
            logger.log("open com port "+port+" failed.try again in 5 seconds");
            setTimeout(this.serialport.open,5000);
        }else{
            this.opened = true;
        }
    });
    //todo
}

function UploadMotor.prototype.recieveDirect= function(){
    logger.info("收到的指令:"+util.inspect(this.currentBuffer));
    if( !validDirect(board.currentBuffer)){
        logger.error("指令校验失败");
        return;
    }
    if (currentBuffer[1] == RECEIVE_UPLOAD){
        this.receiveUpload();
    }
}

UploadMotor.prototype.receiveUpload = function(){

}

module.exports = UploadMotor;