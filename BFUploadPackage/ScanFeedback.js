var util= require('util');
var rest = require('restler');
var crypto = require('crypto');
var feedbackUrl = 'http://114.55.134.122:8099/beifen/cb';
var secretKey = 'njcb@1234';
var logger = require('./log.js').logger;

function ScanFeedback(barCode){
	var timestamp = Date.now();
	
	var together = secretKey+barCode+timestamp;
	var sha1 = crypto.createHash('md5');
	sha1.update(together);
	var calsig=sha1.digest().toString('hex');

	
	var getUrl = feedbackUrl + "?o_no=" + barCode + "&sign=" + calsig + "&timestamp=" + timestamp;
	
	//console.log(getUrl);
	rest.get(getUrl,{parser:rest.parsers.json}).on('complete',function(result){
		if (result instanceof Error) {
			logger.info("scan feedback of "+barCode+" error:"+result.message);
    	//console.log('Error:', result.message);
    	//this.retry(5000); // try again after 5 sec 
  	} else {
  		console.log(result.msg);
  		if (result.msg == "成功"){
  			logger.info("scan feedback of "+barCode+" success");
  		}else{
  			logger.info("scan feedback of "+barCode+" failed");
  		}
  	}	
	});
}




module.exports = ScanFeedback;