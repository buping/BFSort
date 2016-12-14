/**
 * Created by Administrator on 2016/8/4.
 */

var com = require("./com.js");
//var SerialPort = com.SerialPort;

var logger = require('./log.js').logger;
var util= require('util');
var debug = require('debug')('bfsort');
var sunyouApi = require('./SunyouRequest.js');

var Emitter=require("events").EventEmitter;
var scanPackageDb = require('./models').eq_scanpackage;
var workingPort;

var SEND_UPLOAD = 0x01;
var RECEIVE_UPLOAD = 0x03;
var INSTRUCTION_HEADER = 0xAA;
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
    this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

    this.portID = options.PortID;
    this.direction = options.Direction;
    this.opened = false;
    this.isReady = false;
    this.lastBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.currentBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.currentBuffer[0] = INSTRUCTION_HEADER;
    this.sameBufferCount = 0;
    this.sendBuffer = new Buffer(INSTRUCTION_LENGTH);
    this.sendBuffer[0] = INSTRUCTION_HEADER;
    this.sendConfirmed = false;
    this.sendCount = 0;
    this.receivedCount = 1;
    this.isAllowRecieved = false;
    this.lastSerial = 0;

    this.parcel = null;
    this.loadDeviceId = 0;
    this.loadDirection = 0;
    this.loadSucc = false;
    this.isLoading = false;
    this.isSending = false;
    this.employeeName = "admin";
    this.respondStatus = 0;


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
        this.isReady = false;
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
        //logger.info("\rReceive serial data:" + util.inspect(data));

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
EnterPort.prototype = Object.create(Emitter.prototype,{
    constructor:{
        value:EnterPort
    }
});

EnterPort.prototype.Init=function(){
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

EnterPort.prototype.recieveDirect= function(){
    var now = new Date();
    if (!this.currentBuffer.equals(this.lastBuffer)){
        this.sameBufferCount = 0;
        this.currentBuffer.copy(this.lastBuffer);
        util.print("\n");
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
    if (this.currentBuffer[1] == RECEIVE_UPLOAD){
        this.receiveUpload();
    }
};

EnterPort.prototype.receiveUpload = function(){
    var currentBuffer = this.currentBuffer;
    var parcel=this.parcel;
    var respondExitPort = currentBuffer[2] + currentBuffer[3] * 256;
    var respondEnterPort = currentBuffer[4];
    var respondSerialNum = currentBuffer[5] + currentBuffer[6] * 256;
    var respondEnterDirection = (currentBuffer[8] & 0x02) / 2;
    var respondExitDirection = currentBuffer[8] % 2;
    var respondStatus = currentBuffer[9];

    this.respondStatus = respondStatus;
    if (respondStatus == 0x00){
        this.isReady = true;
    }
    if (!this.isLoading || this.parcel === undefined || this.parcel === null){
        return;
    }
    if (respondExitPort == parcel.ExitPort && respondEnterPort == parcel.EnterPort
      && respondSerialNum == parcel.SerialNumber && respondEnterDirection == parcel.EnterDirection
      && respondExitDirection == parcel.ExitDirection){
        this.sendConfirmed = true;
        this.isSending = false;
        if (respondStatus == 0x00) {
            this.loadSucc = true;
            this.isLoading = false;
            this.savePackage();
            this.emit('loaded');
        }
    }
};

/*
 Send a parcel to uploadStation
 */
EnterPort.prototype.sendPackage = function(postPackage) {
    this.loadSucc =false;
    this.parcel = postPackage;
    var sendBuffer = this.sendBuffer;
    sendBuffer[0] = INSTRUCTION_HEADER;
    sendBuffer[1] = 0x01;
    sendBuffer[2] = this.parcel.ExitPort % 256;
    sendBuffer[3] = this.parcel.ExitPort / 256;
    sendBuffer[4] = this.parcel.EnterPort % 256;
    sendBuffer[5] = this.parcel.SerialNumber % 256;
    sendBuffer[6] = this.parcel.SerialNumber / 256;
    sendBuffer[7] = 0x00;
    sendBuffer[8] = this.parcel.EnterDirection * 2 + this.parcel.ExitDirection;
    sendBuffer[9] = 0x00;
    var totalSum = 0;
    for(var i = 0;i<10;i++){
        totalSum += sendBuffer[i];
    }
    sendBuffer[10] = totalSum%256;

    this.parcel.BufStr = util.inspect(sendBuffer);
    this.isSending = true;
    this.isLoading = true;
    this.actualSendData();
    //this.savePackage();
};

EnterPort.prototype.actualSendData = function() {
    if (! this.loadSucc  ) {
        //&& !this.sendConfirmed){
        util.print("\nsending data:" + util.inspect(this.sendBuffer) + "\n");
        this.transport.write(this.sendBuffer);
        this.sendCount++;
        if (this.sendCount > this.settings.repeatSendTimes) {
            this.sendCount=0;
        } else {
            setTimeout(this.actualSendData.bind(this), this.settings.sendInterval);
        }
    }
};

EnterPort.prototype.enqueue = function(fjData){
    if (!this.opened){
        return false;
    }
    if (this.isLoading){
        return false;
    }
    var parcel = fjData;
    parcel.EnterPort = this.portID;
    parcel.EnterDirection = this.direction;
    var outPortWhole = fjData.PortNumber; //like "950|1"
    var exitPort = parseInt(outPortWhole.substr(0,outPortWhole.indexOf('|')));
    var exitDirection = parseInt(outPortWhole.substr(outPortWhole.indexOf('|')+1));
    parcel.ExitPort = exitPort;
    parcel.ExitDirection = exitDirection;
    parcel.Direction = exitDirection;

    var enterPort = parcel.EnterPort;

    logger.info("send package:"+util.inspect(parcel));
    this.isLoading = true;

    if (this.lastSerial == 0){

        scanPackageDb.max('SerialNumber',{where:{EnterPort:enterPort}})
          .then(function(max) {
                if (isNaN(max)){
                    max=0;
                }
                parcel.SerialNumber = (max + 1)%65536;
                if (parcel.SerialNumber == 0)
                    parcel.SerialNumber=1;
                this.lastSerial = parcel.SerialNumber;

                debug("using serialnum:"+parcel.SerialNumber);
                this.sendPackage(parcel);
            }.bind(this)
          );
    }else{
        this.lastSerial++;
        if (this.lastSerial==0 || this.lastSerial >= 65536){
            this.lastSerial=1;
        }
        parcel.SerialNumber = (this.lastSerial)%65536;
        this.sendPackage(parcel);
    }
};

EnterPort.prototype.savePackage = function(){
    var parcel = this.parcel;
    parcel.IsSelect = "0";
    parcel.EmployeeName = this.employeeName;
    parcel.ScanType = "EQ";
    parcel.UploadDate = Date.now();
    scanPackageDb.create(parcel).then(function(ret){
        debug("saved parcel to datebase successful:"+util.inspect(ret));
    },function(err){
        debug("saved parcel to datebase failed:"+util.inspect(err));
    });
};

EnterPort.prototype.isConnected = function(){
    return this.opened;
};

EnterPort.prototype.GetStatus= function(cb,res){
    //todo
    return this.respondStatus;
};

EnterPort.prototype.GetScan = function(scan){
    //todo
    console.log("get scan:"+scan);
    sunyouApi.getPackageInfo(scan,function(scanObj){
        if (scanObj.sortingportnumber != undefined){
            var fjData = {};
            fjData.TrackNum = scan;
            fjData.ChannelCode = scanObj.channelcnname;
            fjData.CountryCode = scanObj.recipient_country_code;
            fjData.CountryCnName = scanObj.countrycnname;
            fjData.PackageWeight = scanObj.predictionweight * 1000;
            fjData.PortNumber = scanObj.sortingportnumber;
            fjData.isFinished = false;

            console.log(fjData);
            EnterPort.working.enqueue(fjData);
        }

    });
};

module.exports = EnterPort;