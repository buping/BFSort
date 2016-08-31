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

function FjData(cb,barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber){
	this.cb = cb;
    this.TrackNum=barcode;
	this.ChannelCode=channelCode;
	this.CountryCode=countryCode;
	this.CountryCnName=countryCnName;
	this.PackageWeight=packageWeight;
	this.PortNumber=portNumber;
	this.UploadDate = Date.now();
	this.isFinished=false;
	this.FinishDate=null;
}

router.get('/', function(req, res, next){
	var cb=req.query.cb;
    var barcode=req.query.barcode;
    var channelCode=req.query.channelCode;
    var countryCode=req.query.countryCode;
    var countryCnName=req.query.countryCnName;
    var packageWeight=req.query.packageWeight;
    var portNumber=req.query.portNumber;

    if (cb === undefined || barcode === undefined || channelCode === undefined ||
        countryCnName === undefined || countryCode === undefined || packageWeight === undefined ||
        portNumber === undefined) {
        debug("incomplete parameters");
        res.send("sendFJCallbacks['"+cb+"']('"+cb+"|FAILURE);");
    }
	
	var received = new FjData(cb,barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber);
	debug("received sunyou message:"+util.inspect(received));
	var enterPort = EnterPort.working;
	
	if (barcode.length > 10 && barcode.length<20){
        enterPort.enqueue(received);

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
		res.send("sendFJCallbacks['"+cb+"']('"+cb+"|SUCCESS);");
        debug("return sucess");
	}else{
		res.send("sendFJCallbacks['"+cb+"']('"+cb+"|FAILURE);");
		debug("return failure");
	}
});

router.ping = function(req,res,next){
	var enterPort = EnterPort.working;
	if (enterPort.isConnected()){
		res.send("FJStatus._onok();");
	}else{
		res.send("FJStatus._onerror('timeout','分拣设备连接失败');");
	}
}

router.status = function (req,res,next){
	var cb=req.query.cb;
	var enterPort = EnterPort.working;
	setTimeout(function(){
		this.send("ok");
	}.bind(res),5000);
	/*
	if (cb === undefined){
		res.send("cb required");
	}else{
		enterPort.GetStatus(cb,res);
		//res.send(util.inspect(enterPort.GetStatus(cb,res)));
	}
	*/
}


module.exports = router;
