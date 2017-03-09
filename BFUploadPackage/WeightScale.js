var com = require("./com.js");
var logger = require('./log.js').logger;
var util = require('util');
var Emitter = require("events").EventEmitter;


var defaults = {
  //reportVersionTimeout: 5000,
  receiveInterval: 100,
  sendInterval: 500,
  repeatSendTimes: 30,	// 最多重发次数
  SerialName: 'COM3',
  SerialPort: {
    baudRate: 9600,
    autoOpen: false,
    parity: 'none',
    xon: false,
    xoff: false,
    xany: false,
    rtscts: false,
    hupcl: true,
    dataBits: 8,
    stopBits: 1,
    bufferSize: 256,
	parser: com.SerialPort.parsers.readline('\n')
  }
};


function WeightScale(options,callback){
  if ("function" == typeof options || "undefined" == typeof options) {
    callback = options;
    options = {};
  }

  if (!(this instanceof WeightScale)) {
    return new WeightScale(options, callback);
  }
  Emitter.call(this);


  this.settings = Object.assign({}, defaults, options);
  this.settings.SerialPort = Object.assign({}, defaults.SerialPort, options.SerialPort);

  this.transport = new com.SerialPort(this.settings.SerialName, this.settings.SerialPort);
  this.opened = false;
  this.currentWeight = 0;

  
  this.transport.on("close", function () {
    this.opened = false;
    this.emit("close")
  }.bind(this));

  this.transport.on("disconnect", function () {
    console.log("com port:" + this.settings.SerialName + " is disconected");
    this.transport.close();
    this.opened = false;
    this.emit("disconnect");
    this.Init();
  }.bind(this));

    this.transport.on("error", function (error) {
    if (!this.opened && "function" == typeof callback) {
      callback(error);
    } else {
      this.emit("error", error);
    }
  }.bind(this));

  this.transport.on('data', function (data) {
	this.parseData(data);
  }.bind(this));
	
  
}

WeightScale.prototype = Object.create(Emitter.prototype, {
  constructor: {
    value: WeightScale
  }
});


WeightScale.prototype.Init = function () {
  //this.transport.close();
  this.transport.open(function (error) {
    if (error) {
      console.log("open com port " + this.settings.SerialName + " failed:" + error + ".try again in 5 seconds");
      this.transport.opening = false;
      setTimeout(this.Init.bind(this), 5000);
    } else {
      console.log("com port " + this.settings.SerialName + " opened successful");
      this.opened = true;
    }
  }.bind(this));
  //todo
};

WeightScale.prototype.parseData = function (data) {
	var num = data.substr(2,7)	
	this.currentWeight = parseFloat(num);
	//console.log(this.currentWeight);
};

WeightScale.prototype.GetWeight = function(){
	return this.currentWeight;
}

module.exports = WeightScale;

/*
var working = new WeightScale();
working.Init();
*/