var Vitronic = require('./vitronic.js');
var util = require('util');


var cfg={};
cfg.addr = "192.168.3.234";
cfg.port = "5001";

var test = new Vitronic(cfg);
test.Init();

test.on('data',function(data){
    console.log(util.inspect(data));
});
