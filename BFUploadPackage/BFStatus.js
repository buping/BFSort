var bfConfig = require ('./config/bfconfig.json');
var logger = require('./log.js').logger;

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://mqtt.bfsort.com' ,{
		username:'beifen',
		password:'beifen111',
		reconnectPeriod: 5000
	}
);

client.on('error',function(err){
	console.log("mqtt error occured,reconnect in 5 seconds:"+err);
});


client.on('connect', function () {
	/*
	 client.subscribe('presence')
	 client.publish('presence', 'Hello mqtt')
	 client.publish('test', 'Hello mqtt')
	 */
	console.log('connect to mqtt server');

});
client.on('message', function (topic, message) {
	// message is Buffer
	console.log(message.toString())
	//client.end()
});


var projectName = bfConfig.ProjectName;
var nodeName = bfConfig.NodeName;

if (projectName == undefined || projectName == null){
	projectName = 'unknown project';
}

if (nodeName == undefined || nodeName == null){
	nodeName = 'unknown node'
}


var StartHeartBeat =function(){
	var heartBeatMsg = {};
	heartBeatMsg.project = projectName;
	heartBeatMsg.name = nodeName;

	var heartBeatFunc = function(){
		heartBeatMsg.time = Date.now();
		client.publish('heartbeat',JSON.stringify(heartBeatMsg));
	}

	setInterval(heartBeatFunc,5000);
};

/* scanType: 0   valid
 *           1   emptyCart
 *           2   invalidScan
 */
var RealtimeScan = function(scanType,msg){
	var scanMsg = {};
	scanMsg.project = projectName;
	scanMsg.node = nodeName;
	scanMsg.scanType = scanType;
	scanMsg.msg = msg;


	client.publish('scan',JSON.stringify(scanMsg));
};

var ReportError = function (level,msg){
	var errMsg = {};
	errMsg.project = projectName;
	errMsg.node = nodeName;
	errMsg.level = level;
	errMsg.msg = msg;

	logger.info(msg);
	client.publish('error',JSON.stringify(errMsg));
};

var ReportSpeed = function (speed){
	var speedMsg = {};
	speedMsg.project = projectName;
	speedMsg.node = nodeName;
	speedMsg.speed = speed;

	client.publish('speed',JSON.stringify(speedMsg));
}


module.exports.StartHeartBeat = StartHeartBeat;
module.exports.RealtimeScan = RealtimeScan;
module.exports.ReportError = ReportError;
module.exports.ReportSpeed = ReportSpeed;

