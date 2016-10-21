var com = require("./com.js");

var logger = require('./log.js').logger;
var util= require('util');
var Command = require('./Command.js');
var Emitter=require('events').EventEmitter;
var debug = require('debug')('bfsort');
var enterOutPortDb = require('./models').ba_enteroutport;
var printQueueDb = require('./models').ba_printqueue;
var scanPackageDb = require('./models').eq_scanpackage;


var defaults = {
  //reportVersionTimeout: 5000,
  Interval: 100,
  //portDelay: 100,
  //sendInterval:500,
  //repeatSendTimes:3,	// 最多重发次数
  SerialPort: {
    baudRate: 115200,
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


function ExitButton(options, callback) {
  if ("function" == typeof options || "undefined" == typeof options) {
    callback = options;
    options = {};
  }

  if (!(this instanceof ExitButton)) {
    return new ExitButton(options, callback);
  }

  this.settings = Object.assign({}, defaults, options);
  this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

  this.queryBoards = this.settings.Boards;
  this.currentQueryIdx = 0;

  this.opened = false;
  this.currentRecvCmd = new Command(Command.BUTTON_TO_PC);

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
    console.log("\rExitButton Receive serial data:" + util.inspect(data));
    this.currentRecvCmd.ReadData(data);
    if (this.currentRecvCmd.isComplete) {
      this.RecvCompleteCmd();
    }
  }.bind(this));
}

ExitButton.prototype.Init = function() {
  this.Open();
};

ExitButton.prototype.Open = function() {
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

ExitButton.prototype.RecvCompleteCmd = function(){
  var cmd=this.currentRecvCmd.Clone();
  this.currentRecvCmd.Clear();
  if (cmd.instructionId != Command.EXIT_TO_BUTTON){
    logger.err("Recv unknown com message:"+util.inspect(cmd.buffer));
    return;
  }

  var statusCode = cmd.status;
  var direction = cmd.direction;

  var bucketFull = statusCode & 0x01;
  var resetSignal = (statusCode & 0x02) >> 1;
  var printSignal = (statusCode & 0x04) >> 2;
  var lockSignal = (statusCode & 0x08) >> 3;

  var isInorOut = (direction & 0x20) >> 5;  //0 内侧出口   1 外侧出口
  var inControl = (direction & 0x08) >> 3;  //内侧出口控制 0 关闭   1开启
  var outControl = (direction & 0x10) >> 4; //外侧出口控制 0 关闭   1 开启

  if (bucketFull == 0x01){
    //
  }else if(resetSignal == 0x01){
    this.RelayToExitPort(cmd);
    if (isInorOut == 0x00){
      this.UpdateExitPort(cmd.exitPort,isInorOut,1);
    }else{
      this.UpdateExitPort(cmd.exitPort,isInorOut,1);
    }
  }else if(printSignal == 0x01){
    this.Print(cmd);
    if (isInorOut == 0x00){
      this.UpdateExitPort(cmd.exitPort,isInorOut,0);
    }else{
      this.UpdateExitPort(cmd.exitPort,isInorOut,0);
    }
  }else if(lockSignal == 0x01){
    this.RelayToExitPort(cmd);
    if (isInorOut == 0x00){
      this.UpdateExitPort(cmd.exitPort,isInorOut,0);
    }else{
      this.UpdateExitPort(cmd.exitPort,isInorOut,0);
    }
  }
};

ExitButton.prototype.RelayToExitPort = function(cmd){
  //todo relay button cmd to eixtport;
  var currentExitPort = require('./ExitPort.js').working;
  currentExitPort.RelayCmd(cmd);
};

ExitButton.prototype.Print = function(cmd){
  //todo add print command;
  var printQueue={};
  printQueue.OutPortCmd = cmd.exitPort;
  printQueue.Direction = cmd.exitDirection;

  printQueueDb.create(printQueue);
};

ExitButton.prototype.UpdateExitPort = function(port,direction,status){
  //todo update exitport status
};




ExitButton.prototype.StartQuery = function(){
  setInterval(this.QueryOne.bind(this),this.settings.Interval);
};

ExitButton.prototype.QueryOne = function(){
  if (!this.opened){
    return;
  }
  var board = this.queryBoards[this.currentQueryIdx];
  this.transport.write(board.SendCmd.buffer);
  console.log("ExitButton sending buffer:"+util.inspect(board.SendCmd.buffer));

  this.currentQueryIdx++;
  if (this.currentQueryIdx >= this.queryBoards.length){
    this.currentQueryIdx = 0;
  }
}

module.exports = ExitButton;


