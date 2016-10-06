var Juxin = require('./juxin.js');
var util = require('util');

var test = new Juxin();
var cfg={};
cfg.addr = "192.168.1.100";
cfg.port = "5000";

test.on('data',function(data){
    console.log(util.inspect(data));
});

test.init(cfg);

