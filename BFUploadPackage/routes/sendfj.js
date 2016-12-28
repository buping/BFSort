var express = require('express');
var router = express.Router();
var util = require('util');
var models = require('../models');
var debug=require('debug')('bfsort');
var EnterPort = require("../EnterPort.js");


/* sunyou interface. */
var currentData={};
var prevData={};

var sendfj = {};

function FjData(barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber){
	this.TrackNum=barcode;
	this.ChannelCode=channelCode;
	this.CountryCode=countryCode;
	this.CountryCnName=countryCnName;
	this.PackageWeight=packageWeight;
	this.PortNumber=portNumber;
	this.isFinished=false;
	this.FinishDate=null;
}

router.get('/', function(req, res, next){
	var barcode=req.query.barcode;
	var channelCode=req.query.channelCode;
	var countryCode=req.query.countryCode;
	var countryCnName=req.query.countryCnName;
	var packageWeight=req.query.packageWeight;
	var portNumber=req.query.portNumber;

	var retJson = {};
	retJson.barcode = barcode;
	retJson.sendfjresult = "OK";

	if (barcode === undefined || channelCode === undefined ||
		countryCnName === undefined || countryCode === undefined || packageWeight === undefined ||
		portNumber === undefined) {
		debug("incomplete parameters");
		retJson.sendfjresult = "ERROR";
		retJson.errMsg = '参数不完整';
		res.json(retJson);
		return;
	}

	var ports = portNumber.split('|');
	if (ports.length != 2){
		retJson.sendfjresult = "ERROR";
		retJson.errMsg = '出口格式不正确:'+portNumber;
		res.json(retJson);
		return;
	}


	var received = new FjData(barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber);
	console.log("received sunyou message:"+util.inspect(received));
	var enterPort = EnterPort.working;



	if (!enterPort.opened){
		retJson.sendfjresult = "ERROR";
		retJson.errMsg = '分拣机未连接';
		res.json(retJson);
	}else if ( (enterPort.respondStatus != 0 && enterPort.respondStatus != 1)){
		retJson.sendfjresult = "BUSY";
		retJson.errMsg = '此时不能上件';
		res.json(retJson);
	}else {
		enterPort.enqueue(received);
		retJson.sendfjresult = "OK";
		res.json(retJson);
	}
	/*
	 models.eq_scanpackage.max('ScanPackageID').then(function (max){
	 debug("current max id is "+max);
	 received.ScanPackageID = max+1;
	 received.IsSelect = "0";
	 received.EmployeeName = "admin";
	 received.ScanType = "EQ";
	 received.SerialNumber =
	 });
	 */
	//Parse(received);
	//res.json("sendFJCallbacks['"+cb+"']('"+cb+"|SUCCESS);");

});

router.ping = function(req,res,next){
	var enterPort = EnterPort.working;
	if (enterPort.isConnected()){
		res.send("FJStatus._onok();");
	}else{
		res.send("FJStatus._onok();");
		//res.send("FJStatus._onerror('timeout','分拣设备连接失败');");
	}
}

router.status = function (req,res,next){
	var cb=req.query.cb;
	var enterPort = EnterPort.working;
	var mystatus = enterPort.respondStatus;

	if (!enterPort.opened){
		mystatus=-1;
	}

	res.json({status:mystatus});
};


router.getscan = function (req,res,next){
	var barcode=req.query.barcode;
	var enterPort = EnterPort.working;
	var mystatus = enterPort.respondStatus;

	var enterPort = EnterPort.working;

	var retJson = {};
	retJson.barcode = barcode;
	retJson.sendfjresult = "OK";

	//enterPort.GetScan(barcode);
	if (!enterPort.opened){
		retJson.sendfjresult = "ERROR";
		retJson.errMsg = '分拣机未连接';
		res.json(retJson);
	}else if ( (enterPort.respondStatus != 0 && enterPort.respondStatus != 1)){
		retJson.sendfjresult = "BUSY";
		retJson.errMsg = '此时不能上件';
		res.json(retJson);
	}else {
		enterPort.GetScan(barcode,function (retval,errMsg){
			if (retval == 0){
				retJson.sendfjresult = "OK";
				res.json(retJson);
			}else{
				retJson.sendfjresult = "ERROR";
				retJson.errMsg = errMsg;
				res.json(retJson);
			}
		});

	}
}



module.exports = router;
