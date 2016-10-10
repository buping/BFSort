var Vitronic = require('./vitronic.js');
var util = require('util');

var test = new Vitronic();
var cfg={};
cfg.addr = "192.168.3.234";
cfg.port = "5001";

test.on('data',function(data){
    console.log(util.inspect(data));
});

test.init(cfg);

