var com = require("./com.js");

var logger = require('./log.js').logger;
var util= require('util');
var BtnCommand = require('./BtnCommand.js');
var Emitter=require('events').EventEmitter;
var debug = require('debug')('bfsort');
var enterOutPortDb = require('./models').ba_enteroutport;
var printQueueDb = require('./models').ba_printqueue;
var scanPackageDb = require('./models').eq_scanpackage;
var enteroutportDb = require('./models').ba_enteroutport;
var sunyouApi = require('./SunyouRequest.js');
var bdt = require('./bdt.js');


var defaults = {
  //reportVersionTimeout: 5000,
  Interval: 30,
  BoardID : 0,
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

  var currentExitPort = require('./ExitPort.js').working;
  this.queryBoards = currentExitPort.queryBoards;
  this.currentQueryIdx = 0;


  this.opened = false;
  this.currentRecvCmd = new BtnCommand(BtnCommand.BUTTON_TO_PC);

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
    //logger.info("ExitButton Receive serial data:" + util.inspect(data));
	//console.log("ExitButton:" + util.inspect(data));
    this.currentRecvCmd.ReadData(data);
    if (this.currentRecvCmd.isComplete) {
      this.RecvCompleteCmd();
    }
  }.bind(this));
}

ExitButton.prototype.Init = function() {
  this.Open();
  this.StartQuery();
  this.GetSavedStatus();
  
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
  if (cmd.instructionId != BtnCommand.BUTTON_TO_PC){
    //logger.error("Recv unknown com message:"+util.inspect(cmd.buffer));
    return;
  }

  var replyCmd = new BtnCommand(BtnCommand.PC_TO_BUTTON);
  replyCmd.exitPortID = cmd.exitPortID;
  replyCmd.totalCount = cmd.totalCount;
  replyCmd.totalWeight = cmd.totalWeight;
  replyCmd.exitDirection = cmd.exitDirection;
  replyCmd.exitStatus = cmd.exitStatus;
  

  var statusCode = cmd.cmdConfirm;
  var exitDirection = cmd.exitDirection;
  var exitPort = cmd.exitPortID;
  
  
  if (exitPort == 984){
	  //console.log(util.inspect(cmd.buffer));
  }

  var bucketFull = statusCode & 0x01;
  var resetSignal = (statusCode & 0x02) >> 1;
  var printSignal = (statusCode & 0x04) >> 2;
  var lockSignal = (statusCode & 0x08) >> 3;

  var recvError = (statusCode & 0x40) >> 6

  var isInorOut = cmd.exitDirection;  //0 内侧出口   1 外侧出口

  if (statusCode == 0){
    return;
  }
  if (recvError == 0x01){
    return;
  }
  
  var exitStatus = 0;
  var cmdConfirm = 0;

  if (bucketFull == 0x01){
    cmdConfirm = 0x01;
    //
  }else if(resetSignal == 0x01){
    cmdConfirm = 0x02;
	  exitStatus = 0x00;


    if (isInorOut == 0x00){
      this.RelayToExitPort(cmd,cmd.exitPortID,isInorOut,1);
      this.UpdateExitPort(cmd.exitPortID,isInorOut,1);
    }else{
      this.RelayToExitPort(cmd,cmd.exitPortID,isInorOut,1);
      this.UpdateExitPort(cmd.exitPortID,isInorOut,1);
    }
  }else if(printSignal == 0x01){
    cmdConfirm = 0x04;
	  exitStatus = 0x04;
    if (isInorOut == 0x00){
      this.UpdateExitPort(cmd.exitPortID,isInorOut,2);
    }else{
      this.UpdateExitPort(cmd.exitPortID,isInorOut,2);
    }

    //this.Print(cmd.exitPortID,isInorOut);
  }else if(lockSignal == 0x01){
	  exitStatus = 0x08;
    cmdConfirm = 0x08;
    this.RelayToExitPort(cmd);
    if (isInorOut == 0x00){
      this.RelayToExitPort(cmd,cmd.exitPortID,isInorOut,0);
      this.UpdateExitPort(cmd.exitPortID,isInorOut,0);
    }else{
      this.RelayToExitPort(cmd,cmd.exitPortID,isInorOut,0);
      this.UpdateExitPort(cmd.exitPortID,isInorOut,0);
    }
  }


  for (var boardIdx in this.queryBoards){
    var board = this.queryBoards[boardIdx];
    if (exitPort == board.Id && exitDirection == board.Direction){
		board.ExitStatus = exitStatus;
		board.CmdConfirm = cmdConfirm;
/*
		if (printSignal == 0x01){
			board.TotalCount++;
			board.TotalWeight+=0.1;
		}
		*/
	}
  }

  replyCmd.exitStatus = exitStatus;
  replyCmd.cmdConfirm = cmdConfirm;
  this.ReplyButton(replyCmd);

};

ExitButton.prototype.ReplyButton = function(replyCmd) {
  replyCmd.MakeBuffer();
  this.transport.write(replyCmd.buffer);
  console.log("exitbutton:send reply "+util.inspect(replyCmd.buffer));
};

ExitButton.prototype.RelayToExitPort = function(cmd,exitPortID,isInorOut,stopOrGo){
  //todo relay button cmd to eixtport;
  var currentExitPort = require('./ExitPort.js').working;
  if (currentExitPort !== undefined)
    currentExitPort.RelayCmd(cmd,exitPortID,isInorOut,stopOrGo);
};

ExitButton.prototype.Print = function(port,direction){
  //todo add print command;
  var printQueue={};
  printQueue.OutPortCmd = port.toString();
  printQueue.Direction = direction.toString();

  printQueueDb.create(printQueue);
  console.log("start print "+port+"|"+direction);
};

ExitButton.prototype.UpdateExitPort = function(port,direction,status){
  //todo update exitport status
  console.log("set port "+port+"|"+direction+" to status "+status);
  enteroutportDb.findOne(
    {
      where:{EnterOutPortCode:port,Direction:direction,EnterOutPortType:'OUT'}
    }
  ).then(function (outPortInfo){
    if (outPortInfo != null && outPortInfo != undefined){
      if (status == 2){
        if (outPortInfo.RunStatus == 0) {
          //sunyouApi.DoPrint(port, direction);
		  bdt.Print(port, direction);
          outPortInfo.RunStatus = 2;
          outPortInfo.save();
        }
      }else if (outPortInfo.RunStatus != status) {
        outPortInfo.RunStatus = status;
        outPortInfo.save();
      }

    }else{
      outPortInfo = {};
      outPortInfo.IsSelect = '0';
      outPortInfo.EnterOutPortName = port + '|' + direction;
      outPortInfo.EnterOutPortCode = port;
      outPortInfo.Direction = direction;
      outPortInfo.EnterOutPortType = 'OUT';
      outPortInfo.TodayCount = 0;
      outPortInfo.CurrentCount = 0;
      outPortInfo.TotalCount = 0;
      outPortInfo.CurrentWeight = 0;
      outPortInfo.RunStatus = status;
      enteroutportDb.upsert(outPortInfo);
    }
  }).catch(function (err){
    console.log('data base error'+err);
  });
  
};

ExitButton.prototype.StartQuery = function(){
  setInterval(this.QueryOne.bind(this),this.settings.Interval);
};

ExitButton.prototype.QueryOne = function(){
  if (!this.opened){
    return;
  }

  var board = this.queryBoards[this.currentQueryIdx];
  
  var query = new BtnCommand(BtnCommand.PC_TO_BUTTON);
  query.enterPortID = 0;
  query.exitDirection = 0;
  query.exitPortID = board.Id;
  query.totalCount = board.TotalCount;
  query.totalWeight = parseInt(board.TotalWeight * 10);
  query.exitStatus = board.ExitStatus;
  query.cmdConfirm = board.CmdConfirm;
  
  if (board.CmdConfirm !=0) 
	  board.CmdConfirm =0;
  query.MakeBuffer();
  board.BtnSendCmd = query;
  
  //console.log(query.exitStatus);

	
  this.transport.write(query.buffer);
  //logger.info("Exitbutton sending buffer:"+util.inspect(query.buffer));d
  //console.log("Exitbutton send:"+util.inspect(query.buffer));

  this.currentQueryIdx++;
  if (this.currentQueryIdx >= this.queryBoards.length){
    this.currentQueryIdx = 0;
  }
};


ExitButton.prototype.GetSavedStatus = function(){
	console.log('get saved status');
	var queryBoards = this.queryBoards;
   enteroutportDb.findAll({where:{EnterOutPortType:'OUT'}}).then(function (allret){
	   console.log("count:"+ allret.length);
	   console.log("board count:"+ queryBoards.length);
	   for (let entry of allret){
		     
		     for (var boardIdx in queryBoards){
				var board = queryBoards[boardIdx];
				if (entry.EnterOutPortCode == board.Id && entry.Direction == board.Direction){
					console.log("get save exit status for "+board.Id +"|" + board.Direction);
					board.TotalCount = entry.CurrentCount;
					board.TotalWeight = entry.CurrentWeight;
					
					var status = entry.RunStatus;
					if (status == 1)
						board.ExitStatus = 0x00;
					else if (status == 2)
						board.ExitStatus = 0x04;
					else if (status == 0)
						board.ExitStatus = 0x08;
				}
			 }
	   }
   });
}

module.exports = ExitButton;


