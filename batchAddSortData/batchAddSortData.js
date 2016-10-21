	var express = require('express');
	var router = express.Router();
	var crypto = require('crypto');
	var util = require('util');
	var cookieParser = require('cookie-parser');
	var bodyParser = require('body-parser');
	var debug=require('debug')('sortdata');

	var Sequelize = require('sequelize');


	var sequelize = new Sequelize('bfsort','bfsort','bfsorting',{
		host: 'localhost',
		dialect: 'mysql',
	  logging: false,
	  isolationLevel:Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
		pool:{
					max:10,
					min:1,
					idle:60000
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


	var appsecret = 'njcb@1234';


	router.use(function(err, req, res, next){
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

	//check for permissions
	function CheckAccess(req,res) {
		var retObj = {};
		retObj.valid = "FALSE";

		var appid=req.query.appid;
		var timestamp=req.query.timestamp;
		var signature=req.query.signature;
		if (appid === undefined  ||  timestamp===undefined || signature===undefined){
			retObj.errorMsg = "incomplete query parameters";
			res.send(retObj);
			return false;
		}
		var together = appid+appsecret+timestamp;
		debug(together);
		var sha1 = crypto.createHash('sha1');
		sha1.update(together);
		var calsig=sha1.digest().toString('hex');
		if (calsig != signature){
			retObj.errorMsg = "wrong signature";
			debug("wrong signature,correct is "+calsig);
			res.send(retObj);
			return false;
		}else{
			return true;
		}
	}


	function AddSortData(req,res){
		if (!CheckAccess(req,res)) {
			return false;
		}

		var retObj = {};

		retObj.ack="FAILURE";
		retObj.valid = "TRUE";
		var reqBody = req.body;

		//retObj.packageCount = reqBody.packageCount;
		retObj.packageCount=0;

		if (reqBody.operationSerialNum === undefined){
			retObj.errorMsg="missing parameters operationSerialNum";
			res.send(retObj);
			return false;
		}
		retObj.operationSerialNum = reqBody.operationSerialNum;

		if (reqBody.packageCount === undefined){
			retObj.errorMsg="missing parameters packageCount";
			res.send(retObj);
			return false;
		}
		retObj.packageCount = reqBody.packageCount;

		if (reqBody.packageList === undefined){
			retObj.errorMsg="missing parameters packageList";
			res.send(retObj);
			return false;
		}

		for (var i=0;i<retObj.packageCount;i++){
			if (reqBody.packageList[i] === undefined){
				retObj.errorMsg="no "+i+" packageData";
				res.send(retObj);
				return false;
			}
		}

		/*
		Sequelize.Promise.map(reqBody.packageList,function(package){
				return sortData.insertOrUpdate(package).catch(function(err){
					sortData.insertOrUpdate(package);
				});
		}).then(function(){
			retObj.ack = "SUCCESS";
			res.send(retObj);
		}).catch(function (err){
			retObj.errorMsg = "error in insert into database:"+err;
			res.send(retObj);
			return false;
		});
		*/
	sortData.bulkCreate(reqBody.packageList,{"updateOnDuplicate":["packageSite","updatedAt"]}).then(function(){
		retObj.ack = "SUCCESS";
		res.send(retObj);
	}).catch(function (err){
		retObj.errorMsg = "error in insert into database:"+err;
		res.send(retObj);
		return false;
	});

		return true;
	}

	router.get("/",function(req,res,next){
		res.send("use post please");
	});

	router.post("/",function(req, res) {
		debug("query:" + req.query.appid);

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
		AddSortData(req,res);
	});

	module.exports = router;
	//app.listen(27406);
