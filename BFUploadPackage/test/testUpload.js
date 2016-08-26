var SerialPort = require('serialport');
var util=require('util');
var savedData = new Buffer(11);
var count=0;
/*
var upload= new SerialPort('com4',{
	baudRate: 57600
});
*/

var entry=  new SerialPort('com3',{
	baudRate: 115200
});

/*
upload.on('data',function(data){
	if (Buffer.compare(data,savedData)!=0){
		console.log("upload:"+ util.inspect(data));
		savedData = data;
	}
});
*/

entry.on('data',function(data){
	if (Buffer.compare(data,savedData)!=0){
		console.log("entry:"+ util.inspect(data));
		savedData = data;
		
		
		if (data.length > 11 && data[0] == 0xAA && data[9] == 0x01){
			console.log("entry received searchCar");
			var gotCar = new Buffer(11);
			data.copy(gotCar,0,0,11);
			console.log("send gotcar:" + util.inspect(gotCar));
			entry.write(gotCar);
		}
		
	}
});

/*
upload.on('open',function(){
});
*/