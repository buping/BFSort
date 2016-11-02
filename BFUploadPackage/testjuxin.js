var Vitronic = require('./vitronic.js');
var util = require('util');


var cfg={};
cfg.addr = "192.168.3.234";
cfg.port = "5001";
var id=1;
var startSend = false;

var test = new Vitronic(cfg);
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
    console.log(util.inspect(data));
	if (!startSend){
		startSend = true;
		SendId();
	}
});

