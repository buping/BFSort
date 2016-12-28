var bfConfig = require ('./config/bfconfig.json');

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://47.90.45.27' ,{
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
}

module.exports.StartHeartBeat = StartHeartBeat;
module.exports.RealtimeScan = RealtimeScan;
