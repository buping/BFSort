var util= require('util');
var rest = require('restler');
var crypto = require('crypto');
var searchUrl = 'http://114.55.134.122:8089/beifen/search';
var secretKey = 'njcb@1234';
var logger = require('./log.js').logger;

function SearchBarcode(barCode,cb){
	var timestamp = Date.now();
	
	var together = secretKey+barCode+timestamp;
	var sha1 = crypto.createHash('md5');
	sha1.update(together);
	var calsig=sha1.digest().toString('hex');

	
	var getUrl = searchUrl + "?o_no=" + barCode + "&sign=" + calsig + "&timestamp=" + timestamp;
	
	//console.log(getUrl);
	rest.get(getUrl,{parser:rest.parsers.json}).on('complete',function(result){
		if (result instanceof Error) {
			logger.error("additional search "+barCode+" error:"+result.message);
    	//console.log('Error:', result.message);
    	//this.retry(5000); // try again after 5 sec 
  	} else {  		
  		if (result.msg == "成功"){
  			logger.info("additional search "+barCode+" success");
  			if (typeof cb == 'function'){
  				cb(result.packageSite);
  			}
  		}else{
  			logger.info("additional search "+barCode+" failed");
  		}
  	}	
	});
}




module.exports = SearchBarcode;