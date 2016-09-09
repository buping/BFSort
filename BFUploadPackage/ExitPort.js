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
    Interval: 100,
    //portDelay: 100,
    //sendInterval:500,
    //repeatSendTimes:3,	// 最多重发次数
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
    this.currentQueryIdx = 0;

    this.opened = false;
    this.currentRecvCmd = new Command(Command.EXIT_TO_PC);

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
        this.emit("disconnect");
        this.Open();
    }.bind(this));

    //reopen
    this.transport.on("error", function (error) {
        debug("com port:" + this.settings.SerialName + " error");
        this.transport.close();
        this.Open();
    }.bind(this));

    this.transport.on('data', function (data) {
        console.log("\rExitport Receive serial data:" + util.inspect(data));
        this.currentRecvCmd.ReadData(data);
        if (this.currentRecvCmd.isComplete) {
            this.RecvCompleteCmd();
        }
    }.bind(this));
}

ExitPort.prototype.Init = function() {
    for (var boardIdx in this.queryBoards){
        var board = this.queryBoards[boardIdx];
        var query = new Command(Command.PC_TO_EXIT);
        query.exitPortID = board.Id;
        query.exitDirection = board.Direction;
        query.MakeBuffer();
        board.SendCmd = query;
        var response = new Command(Command.EXIT_TO_PC);
        board.RecvCmd = response;
        //board.
    }
    this.Open();
    this.StartQuery();
};

ExitPort.prototype.Open = function() {
    this.transport.open(function (error) {
        if (error) {
            console.log("open com port " + this.settings.SerialName + " failed:" + error + ".try again in 5 seconds");
            this.transport.opening = false;
            setTimeout(this.Open.bind(this), 5000);
        } else {
            console.log("com port " + this.settings.SerialName + " opened successful");
            this.opened = true;
        }
    }.bind(this));
};

ExitPort.prototype.RecvCompleteCmd = function(){
    var cmd=this.currentRecvCmd.Clone();
    this.currentRecvCmd.Clear();
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

    for (var boardIdx in this.queryBoards){
        var board = this.queryBoards[boardIdx];
        if (exitPortID == board.Id && exitDirection == board.Direction){
            board.TotalCount = packageCount;
            if (cmd.serialNumer != 0) {
                this.SavePackage(cmd);
            }
        }
    }
};

ExitPort.prototype.SavePackage = function(cmd){
    var package;
    console.log("saving receiving cmd:");
    console.log(util.inspect(cmd));
    scanPackageDb.findOrCreate({where:{SerialNumber:cmd.serialNumer,EnterPort:cmd.enterPortID}})
        .then(
        function (res,created){
            //res.FinishDate = Date.now();
            debug(util.inspect(res));
            if (created){
                res.Logs = "err no such serial number in upload";
            }else{
                res.Logs = "succ";
            }
            scanPackageDb.upsert(res);
            return package;
        }
    );
    //todo:Post message to chengbang server
};


ExitPort.prototype.StartQuery = function(){
    setInterval(this.QueryOne.bind(this),this.settings.Interval);
};

ExitPort.prototype.QueryOne = function(){
    if (!this.opened){
        return;
    }
    var board = this.queryBoards[this.currentQueryIdx];
    this.transport.write(board.SendCmd.buffer);
    console.log("Exitport sending buffer:"+util.inspect(board.SendCmd.buffer));

    this.currentQueryIdx++;
    if (this.currentQueryIdx >= this.queryBoards.length){
        this.currentQueryIdx = 0;
    }
}

module.exports = ExitPort;


