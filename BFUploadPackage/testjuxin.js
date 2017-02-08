var datalogic = require('./datalogic.js');
var util = require('util');


var cfg={};
cfg.addr = "172.24.24.1";
cfg.port = 51236;
var id=1;
var startSend = false;

var test = new datalogic(cfg);
test.Init();


function SendId(){
	setInterval(function(){
	id = id+1;
	if (id>=10000){
		id=1;
	}
	//console.log('send id:'+id);
	test.sendIdentifier(id);
	
	},380);
}

test.on('data',function(data){
    console.log(data);
	if (!startSend){
		startSend = true;
		SendId();
	}
});

