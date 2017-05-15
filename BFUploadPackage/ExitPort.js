var com = require("./com.js");

var logger = require('./log.js').logger;
var util = require('util');
var Command = require('./Command.js');
var Emitter = require('events').EventEmitter;
var debug = require('debug')('bfsort');
var scanPackageDb = require('./models').eq_scanpackage;
var enteroutportDb = require('./models').ba_enteroutport;
var bfstatus = require('./BFStatus.js');


var defaults = {
  //reportVersionTimeout: 5000,
  Interval: 60,
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

  this.activeQuery = this.settings.ActiveQuery;
  if (this.activeQuery == undefined) {
    this.activeQuery = false;
  }

  this.queryBoards = this.settings.Boards;
  this.currentQueryIdx = 0;
  this.allExitPort = [];
  this.exitDirection = 0;

  this.relayCmd = null;
  this.relayConfirmed = false;
  this.relayCount = 0;

  this.relayexitPortID = 0;
  this.relayisInorOut = 0;
  this.relaystopOrGo = 0;


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
    logger.info("Exitport Receive:" + util.inspect(data));
    this.currentRecvCmd.Clear();
    this.currentRecvCmd.ReadData(data);
    if (this.currentRecvCmd.isComplete) {
      this.RecvCompleteCmd();
    }
  }.bind(this));
}

ExitPort.prototype.Init = function () {
  for (var boardIdx in this.queryBoards) {
    var board = this.queryBoards[boardIdx];
    board.TotalCount = 0;
    board.TotalWeight = 0;
    board.ExitStatus = 0;
    board.CmdConfirm = 0;
    var query = new Command(Command.PC_TO_EXIT);
    this.allExitPort.push(board.Id);
    this.exitDirection = board.Direction;
    query.exitPortID = board.Id;
    query.exitDirection = board.Direction;
    query.MakeBuffer();
    board.SendCmd = query;
    var response = new Command(Command.EXIT_TO_PC);
    board.RecvCmd = response;
    board.LastAliveTime = Date.now();
    board.PrintLastAliveTime = Date.now();
    //board.
  }
  this.Open();
  this.StartQuery();

  setInterval(this.CheckBoardAlive.bind(this),5000);
};

ExitPort.prototype.Open = function () {
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

ExitPort.prototype.RecvCompleteCmd = function () {
  var cmd = this.currentRecvCmd.Clone();
  this.currentRecvCmd.Clear();
  if (cmd.instructionId != Command.EXIT_TO_PC) {
    //logger.error("Recv unknown com message:"+util.inspect(cmd.buffer));
    return;
  }

  logger.info("receive exit package:" + cmd.exitPortID + "|" + cmd.exitDirection + ",serial is " + cmd.serialNumber);

  this.CheckRelayResponse(cmd);

  for (var boardIdx in this.queryBoards) {
    var board = this.queryBoards[boardIdx];
	  if (cmd.exitPortID == board.Id){
      board.LastAliveTime = Date.now();
      var elapsed = Date.now() - board.LastSendTime;
      board.LastReceiveTime = Date.now();
      console.log( board.Id + " 485 response time:"+elapsed);
    }
  }

  //console.log(cmd.exitPortID + "|"+ cmd.serialNumber);
  if (cmd.serialNumber == 0) {
    return;
  }


  var exitPortID = cmd.exitPortID;
  var exitDirection = cmd.exitDirection;
  var serialNumber = cmd.serialNumber;
  var enterPortID = cmd.enterPortID;
  var wholeSerial = (enterPortID << 16) + serialNumber;
  var packageCount = cmd.reserved;
  var inExitToCarEn = (cmd.status & 0x10) >> 4;  //0 内侧出口   1 外侧出口
  var outExitToCarEn = (cmd.status & 0x20) >> 5;  //内侧出口控制 0 关闭   1开启
  var exitToCarEn;
  if (exitDirection == 0) {
    exitToCarEn = inExitToCarEn;
  } else {
    exitToCarEn = outExitToCarEn;
  }
  /*
   if (packageCount ==0){
   return;
   }
   */


  //logger.info("receive exit package:" + cmd.exitPortID + "|" + cmd.exitDirection + ",serial is " + cmd.serialNumber);

  console.log(this.queryBoards.length);
  for (var boardIdx in this.queryBoards) {
    var board = this.queryBoards[boardIdx];
    if (exitPortID == board.Id && exitDirection == board.Direction) {
      //board.TotalCount = packageCount;
      if (exitToCarEn == 1 && board.ExitStatus == 0x08) {
        board.ExitStatus = 0x00;
      }
      if (exitToCarEn == 0 && board.ExitStatus == 0x00) {
        board.ExitStatus = 0x08;
      }
      if (wholeSerial != 0 && board.lastSerialNum != wholeSerial) {
        board.lastSerialNum = wholeSerial;
        this.SavePackage(cmd, board);
      }
    }
  }
};


ExitPort.prototype.SavePackage = function (cmd, board) {
  var package;
  console.log("saving receiving cmd:" + util.inspect(cmd));
  scanPackageDb.findOne(
    {
      where: {SerialNumber: cmd.serialNumber, EnterPort: cmd.enterPortID, FinishDate: null},
      order: 'UploadDate DESC'
    }
  ).then(
    function (foundPackage) {
      if (foundPackage == null) {
        logger.error("exitport receive package not in enterport,serial:"
          + cmd.serialNumber + ",enterport:" + cmd.enterPortID);
      } else {
        foundPackage.FinishDate = Date.now();
        //res.Logs = "err no such serial number in upload";
        foundPackage.Logs = "succ";
        foundPackage.save().then(function (ret) {
          scanPackageDb.count(
            {
              where: {TrackNum: foundPackage.TrackNum, PrintQueueID: null, FinishDate: {ne: null}}
            }
          ).then(function (count) {
            console.log("count = " + count);
            if (count == 1) {
              enteroutportDb.findOne(
                {
                  where: {EnterOutPortCode: cmd.exitPortID, Direction: cmd.exitDirection, EnterOutPortType: 'OUT'}
                }
              ).then(function (outPortInfo) {
                if (outPortInfo != null && outPortInfo != undefined) {
                  outPortInfo.TodayCount++;
                  outPortInfo.CurrentCount++;
                  outPortInfo.TotalCount++;
                  outPortInfo.CurrentWeight += foundPackage.PackageWeight;
                  board.TotalCount = outPortInfo.CurrentCount;
                  board.TotalWeight = outPortInfo.CurrentWeight;
                  outPortInfo.save();
                } else {
                  outPortInfo = {};
                  outPortInfo.IsSelect = '0';
                  outPortInfo.EnterOutPortName = cmd.exitPortID + '|' + cmd.exitDirection;
                  outPortInfo.EnterOutPortCode = cmd.exitPortID;
                  outPortInfo.Direction = cmd.exitDirection;
                  outPortInfo.EnterOutPortType = 'OUT';
                  outPortInfo.TodayCount = 1;
                  outPortInfo.CurrentCount = 1;
                  outPortInfo.TotalCount = 1;
                  outPortInfo.CurrentWeight = foundPackage.PackageWeight;
                  enteroutportDb.upsert(outPortInfo);
                }
              });
            }
          });
        });
      }
    }
  ).catch(function (err) {
    logger.error("database error in find package:" + err);
  });
  //todo:Post message to chengbang server
};


ExitPort.prototype.StartQuery = function () {
  setInterval(this.QueryOne.bind(this), this.settings.Interval);
};

ExitPort.prototype.QueryOne = function () {
  if (!this.opened) {
    return;
  }

  if (this.relayCmd != null) {
    this.relayCount++;
    if (this.relayCount > 30) {
      this.relayCmd = null;
      logger.info("relay button to exitport,cmd " + util.inspect(this.relayCmd) + " failed,no response in time");
    } else {
      logger.info("relay button to exitport,cmd " + util.inspect(this.relayCmd) + " for " + this.relayCount + "times");
      this.transport.write(this.relayCmd);
      //this.relayCmd = null;
      //return;
    }
  }

  if (this.activeQuery) {
    var board = this.queryBoards[this.currentQueryIdx];
    this.transport.write(board.SendCmd.buffer);

    if (board.LastReceiveTime == 0){
      console.log(board.Id+' last 485 no response');
    }
    board.LastSendTime = Date.now();
    board.LastReceiveTime = 0;
    //console.log("Exitport sending buffer:"+util.inspect(board.SendCmd.buffer));
    logger.info("Exitport sending buffer:" + util.inspect(board.SendCmd.buffer));

    this.currentQueryIdx++;
    if (this.currentQueryIdx >= this.queryBoards.length) {
      this.currentQueryIdx = 0;
    }
  }
};

ExitPort.prototype.RelayCmd = function (cmd, exitPortID, isInorOut, stopOrGo) {
  if (!this.opened) {
    return;
  }

  this.relayCmd = cmd.buffer;
  this.relayConfirmed = false;
  this.relayCount = 0;
  this.relayexitPortID = exitPortID;
  this.relayisInorOut = isInorOut;
  this.relaystopOrGo = stopOrGo;
  //this.transport.write(cmd.buffer);
};


ExitPort.prototype.GetExitPortData = function (cmd) {
  var working = ExitPort.working;
  return enteroutportDb.findAll({
      where: {EnterOutPortCode: working.allExitPort, Direction: working.exitDirection, EnterOutPortType: 'OUT'},
      order: 'EnterOutPortCode ASC'
    }
  );
};


ExitPort.prototype.CheckRelayResponse = function (cmd) {
  if (this.relayCmd == null)
    return;

  var exitPortID = cmd.exitPortID;

  if (exitPortID != this.relayexitPortID) {
    return;
  }
  var inExitToCarEn = (cmd.status & 0x10) >> 4;  //0 内侧出口   1 外侧出口
  var outExitToCarEn = (cmd.status & 0x20) >> 5;  //内侧出口控制 0 关闭   1开启

  if (this.relayisInorOut == 0) {
    if (inExitToCarEn == this.relaystopOrGo) {
      this.relayCmd = null;
      this.relayConfirmed = true;
      logger.info("relay button to exitport confimed:" + this.relayexitPortID + "|" + this.relayisInorOut + " to " +
        this.relaystopOrGo);
    }
  } else if (this.relayisInorOut == 1) {
    if (outExitToCarEn == this.relaystopOrGo) {
      this.relayCmd = null;
      this.relayConfirmed = true;
      logger.info("relay button to exitport confimed:" + this.relayexitPortID + "|" + this.relayisInorOut + " to " +
        this.relaystopOrGo);
    }
  }
};

ExitPort.prototype.CheckBoardAlive = function (){
  var now = Date.now();

  for (var boardIdx in this.queryBoards) {
    var board = this.queryBoards[boardIdx];
    var elapsed = (now - board.LastAliveTime)/1000;
	//console.log(board.Id +" elapsed "+ elapsed);
    if (elapsed > 10){
      logger.info("出口板"+board.Id+"无回应,请停机检修");
      bfstatus.ReportError(2,"出口板"+board.Id+"无回应,请停机检修");
    }
  }
};


module.exports = ExitPort;


