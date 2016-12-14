var sunyou = require('./SunyouRequest.js');


function test(){ 
	var now = Date.now();
	sunyou.getPackageInfo('SYHKA00004840',function(info){
		console.log(info);
	});
}

setTimeout(test,2000);