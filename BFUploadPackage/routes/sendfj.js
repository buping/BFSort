var express = require('express');
var router = express.Router();
var util = require('util');
var models = require('../models');
var debug=require('debug')('bfsort');
var enterPort = require("../EnterPort.js").working;

/* sunyou interface. */
var currentData={};
var prevData={};

var sendfj = {};

function FjData(cb,barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber){
	this.cb = cb;
    this.barcode=barcode;
	this.channelCode=channelCode;
	this.countryCode=countryCode;
	this.countryCnName=countryCnName;
	this.packageWeight=packageWeight;
	this.portNumber=portNumber;
	this.receiveTime = new Date().getTime();
	this.isFinished=false;
	this.finishTime=null;
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
	
	if (barcode.length > 10 && barcode.length<20 &&
        enterPort.equeue(received)){

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
	if (enterPort.isConnected()){
		res.send("FJStatus._onok();");
	}else{
		res.send("FJStatus._onerror('timeout','分拣设备连接失败');");
	}
}

router.status = function (req,res,next){
	var cb=req.query.cb;
	if (cb === undefined){
		res.send("cb required");
	}else{
		res.send(enterPort.GetStatus(cb));
	}
}


module.exports = router;
