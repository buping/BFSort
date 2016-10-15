var express = require('express');
var app=express();
var crypto = require('crypto');
var util = require('util');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug=require('debug')('sortdata');

var Sequelize = require('sequelize');


var sequelize = new Sequelize('bfsort','bfsort','bfsorting',{
    host: 'localhost',
    dialect: 'mysql',
    pool:{
        max:5,
        min:0,
        idle:10000
    },
});


var sortData = sequelize.define('sortData',{
    packageBarcode:{
        type:Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    packageSite:{
        type:Sequelize.STRING
    }
},{
    freezeTableName:true
});

sortData.sync().then(function(){
/*
    return sortData.create({
        packageBarcode:'100000111',
        packageSite:'001'
    });
*/
});


var appsecret = 's7M#z34!f#%@$@Zwe$';

var jsonParser = bodyParser.json();
app.use(bodyParser.json());
//app.use(bodyParser.raw());
//var rawParser = bodyParser.raw();
//app.use(rawParser);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(function(err, req, res, next){
	retObj = new Object();

	if (err instanceof SyntaxError){
		retObj.errorMsg = "post json format error";
	}else{
		retObj.errMsg = "error,please consult admin";
	}
	res.send(retObj);

	next(err);
    //console.log("my error");
    //console.error(err.stack);
    //next();
});


function AddSortData(req){
	  var retObj = new Object();
	  retObj.valid = "FALSE";
	
	  var appid=req.query.appid;
	  var timestamp=req.query.timestamp;
	  var signature=req.query.signature;
	  if (appid === undefined  ||  timestamp===undefined || signature===undefined){
	  	retObj.errorMsg = "incomplete query parameters";
	  	return retObj;
	  }
	  var together = appid+appsecret+timestamp;
	  debug(together);
	  var sha1 = crypto.createHash('sha1');
	  sha1.update(together);
	  var calsig=sha1.digest().toString('hex');
	  if (calsig != signature){
	    retObj.errorMsg = "wrong signature";
	    debug("wrong signature,correct is "+calsig);
	    return retObj;
	  }else{
	  	retObj.valid = "TRUE";
	} 
	retObj.ack="FAILURE";
  	var reqBody=new Object();
  	/*
	  try{
	  	   console.log(util.inspect( req.body));
	  	   console.log(req.body);
	  	  	reqBody = JSON.parse(req.body);
	  }catch (ex){
		  	retObj.errorMsg = "post data json format error";
		  	console.log("json parse error" + ex.stack);
		  	return retObj;
	  }*/
	  reqBody=req.body;
	  
  	  //retObj.packageCount = reqBody.packageCount;
  	  retObj.packageCount=0;
  	  
  	  if (reqBody.operationSerialNum === undefined){
  	  		retObj.errorMsg="missing parameters operationSerialNum";
  	  		return retObj;
  	  }
  	  retObj.operationSerialNum = reqBody.operationSerialNum;
  	  
  	  if (reqBody.packageCount === undefined){
  	  		retObj.errorMsg="missing parameters packageCount";
  	  		return retObj;  	  	
  	  }
  	  retObj.packageCount = reqBody.packageCount;
  	  
  	  if (reqBody.packageList === undefined){
  	  		retObj.errorMsg="missing parameters packageList";
  	  		return retObj;  	  	
  	  }

  	  for (var i=0;i<retObj.packageCount;i++){
  	  		if (reqBody.packageList[i] === undefined){
	  	  		retObj.errorMsg="no "+i+" packageData";
	  	  		return retObj;  	  		
  	  		}
  	  }
  	  
  	  try{
	  	  for (var i=0;i<retObj.packageCount;i++){	  		
	  	  		sortData.insertOrUpdate (reqBody.packageList[i]);
	  	  }
	 }catch (ex){
	 	  debug("err in insertOrUpdate" + ex.stack);
	  	  retObj.errorMsg="err in  insertOrUpdate "+i+" packageData";
	  	  return retObj;  	  		
	 }
	 retObj.ack = "SUCCESS";
	 return retObj;
}

app.post("/autoSorting/batchAddSortData",function(req, res) {
  debug("query:" + req.query.appid);
  var retObj = AddSortData(req);

/*
  var together = appid+appsecret+timestamp;
  console.log(together);
  var sha1 = crypto.createHash('sha1');
  sha1.update(together);
  var calsig=sha1.digest().toString('hex');
  var retObj=new Object();
  if (calsig != signature){
    retObj.valid = "FALSE";
    console.log("wrong signature,correct is "+calsig); 
  }else{
    retObj.valid = "TRUE";
	console.log("right signature");
  }
  console.log(req.body.operationSerialNum);
  console.log(req.body.packageCount);
  retObj.operationSerialNum = req.body.operationSerialNum;
  
  for (var i=0;i<req.body.packageCount;i++){
     console.log(req.body.packageList[i].packageBarcode);
     console.log(req.body.packageList[i].packageSite);

     sortData.create(req.body.packageList[i]);
  }  
  retObj.ack  = "SUCCESS";
  retObj.packageCount = req.body.packageCount;
  retObj.errorMsg = "";

*/
  res.send(retObj);
});

app.listen(27406);
