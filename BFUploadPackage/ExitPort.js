var com = require("./com");

var log4js = require('log4js');
var logger = log4js.getLogger();
var util= require('util');
var Command = require('./command');
var Emitter=require("events").EventEmitter;
var debug = require('debug')('bfsort');
var scanPackageDb = require('./models').eq_scanpackage;


var defaults = {
    //reportVersionTimeout: 5000,
    exitInterval: 1000,
    portDelay: 100,
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


function ExitPort(options, callback) {
    if ("function" == typeof options || "undefined" == typeof options) {
        callback = options;
        options = {};
    }

    if (!(this instanceof ExitPort)) {
        return new ExitPort(options, callback);
    }

    this.settings = Object.assign({}, defaults, options);
    this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

    this.queryBoards = this.settings.Boards;

    this.opened = false;
    this.isReady = false;
    this.currentRecvCmd = new Command();

    this.transport = new com.SerialPort(options.SerialName, this.settings.SerialPort);

    this.transport.on("close", function () {
        this.opened = false;
        this.emit("close")
    }.bind(this));
    //com port closed accidently,try open afterwards;
    this.transport.on("disconnect", function () {
        debug("com port:" + this.settings.SerialName + " is disconected");
        this.transport.close();
        this.opened = false;
        this.isReady = false;
        this.emit("disconnect");
        this.Init();
    }.bind(this));

    this.transport.on("error", function (error) {
        if (!this.isReady && "function" == typeof callback) {
            callback(error);
        } else {
            this.emit("error", error);
        }
    }.bind(this));

    this.transport.on('data', function (data) {
        logger.info("\rReceive serial data:" + util.inspect(data));
        this.currentRecvCmd.ReadData(data);
        if (this.currentRecvCmd.isComplete) {
            this.RecvCompleteCmd();
        }
    }.bind(this));
}

ExitPort.prototype.Init = function() {
    for (var board in this.queryBoards){
        var query = new Command(Command.PC_TO_EXIT);
        query.exitPortID = board.Id;
        query.status = board.Direction;
        query.MakeBuffer();
        board.SendCmd = query;
        var response = new Command(Command.EXIT_TO_PC);
        board.RecvCmd = response;
        //board.
    }
};

ExitPort.prototype.RecvCompleteCmd = function(){
    var cmd=this.currentRecvCmd;
    if (cmd.instructionId != Command.EXIT_TO_PC){
        logger.err("Recv unknown com message:"+util.inspect(cmd.buffer));
        return;
    }

    var exitPortID = cmd.exitPortID;
    var exitDirection = cmd.exitDirection;
    var packageCount = cmd.reserved;
    if (packageCount ==0){
        return;
    }

    for (var board in this.queryBoards){
        if (exitPortID == board.Id && exitDirection == board.Direction){
            this.SavePackage(cmd.copy());
        }
    }
};

ExitPort.prototype.SavePackage = function(cmd){
    //var package = scanPackageDb.findOne()
};


ExitPort.prototype.QueryAll = function(){

};

ExitPort.prototype.QueryOne = function(idx){

};

module.exports = ExitPort;


