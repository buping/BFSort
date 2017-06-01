//var bdt=require('./bdt.js');
var request = require('request');
var util = require('util');
var printQueueDb = require('./models').ba_printqueue;
var pr_serialDb = require('./models').pr_serialnumber;
var scanPackageDb = require('./models').eq_scanpackage;
var enteroutportDb = require('./models').ba_enteroutport;
var sequelize = require('sequelize');
var LODOP = require('./CLodopfuncs.js');


function test(){
	//bdt.DoPrint('984|0',2,3);
}

var loginOptions = {
	url: "http://sys.etg56.com/automationApi/verificationUserLogin",
	form: {
		"token": '10D4E746C69885D143E33D0C3108EA48',
		"userName": 'zb_opr',
		"userPwd" : 'zb_opr'
	},
	method: 'POST'
};


var loginRequest = request.defaults({jar: true});   //login every 10 minutes

var bdtLogin = function () {
	console.log('send login request');
	loginRequest(loginOptions, function (error, response, body) {

		console.log(response.statusCode);
		console.log(body);
	});
};

bdtLogin();

var bdtGetExit = function(barCode,cb){
	var getExitOptions = {
		url: "http://sys.etg56.com/automationApi/getParcelExport",
		form: {
			"token": '10D4E746C69885D143E33D0C3108EA48',
			"trackingNo": barCode
		},
		method: 'POST'
	};

	loginRequest(getExitOptions, function (error, response, body) {
		//console.log(response.statusCode);
		//console.log(body);
		try{
			var resObj = 	JSON.parse(body);
			if (resObj != null && resObj != undefined)
				cb(resObj);
			else{
				cb(null);
			}
		}catch(err){
			logger.info("error in getexit:"+err);
			cb(null);
		}

	});
};


var bdtPushWeight = function(trackingNo,weight,userName){
	var pushWeightOptions = {
		url: "http://sys.etg56.com/automationApi/generateStorageDetails",
		form: {
			"token": '10D4E746C69885D143E33D0C3108EA48',
			"trackingNo": trackingNo,
			"weight": weight,
			"userName":userName
		},
		method: 'POST'
	};

	loginRequest(pushWeightOptions, function (error, response, body) {
		console.log(response.statusCode);
		console.log(body);
	});
};


function DoPrint(port,direction){
	pr_serialDb.update({
		SerialNumber: sequelize.literal('SerialNumber +1')
	},{
		where:{}
	}).then(function (myval) {
		pr_serialDb.findOne().then(function (newval) {
			//console.log("using serial number"+newval.SerialNumber);
			if (newval != null && newval != undefined){
				GetPrintDataUsingSerial(port,direction,newval.SerialNumber);
			}else{
				newval = {};
				newval.SerialNumber = 1000000001;
				pr_serialDb.insert(newval);
				GetPrintDataUsingSerial(port,direction,newval.SerialNumber);
			}
		});
	});
}

function getNowFormatDate(){
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var strdate = now.getDate();
	var hour = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();

	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strdate >= 0 && strdate <= 9) {
		strdate = "0" + strdate;
	}
	if (seconds >= 0 && seconds <= 9) {
		seconds = "0" + seconds;
	}

	var strNow = "print" + year + month + strdate + hour + minutes + seconds;
	return strNow;
}

function GetPrintDataUsingSerial(port,direction,serialNum){
	scanPackageDb.findAll({
		where:{
			ExitPort:port,
			ExitDirection:direction,
			PrintQueueID:null,
			FinishDate:{ne:null}
		}
	}).then(function (allPackages){
		if (allPackages.length>0){
			var printQueue={}
			var packageList = [];
			var trackNumMap = new Map();
			printQueue.PrintQueueName = getNowFormatDate();
			printQueue.OutPortCmd = port;
			printQueue.Direction = direction;
			printQueue.SerialNumber = serialNum;
			printQueue.Count = allPackages.length;
			printQueue.Weight = 0;
			for (var i=0;i<allPackages.length;i++){
				var package = allPackages[i];
				if (!trackNumMap.has(package.TrackNum)) {
					printQueue.Weight += allPackages[i].PackageWeight;
					packageList.push({packageBarcode: package.TrackNum, packageSortingCode: port + '|' + direction});
					trackNumMap.set(package.TrackNum,package);
				}
			}
			printQueue.Count = packageList.length;
			printQueue.Weight = printQueue.Weight/1000;

			printQueueDb.create(printQueue).then(function(printQueue){
				if (printQueue != null && printQueue != undefined) {
					console.log(printQueue.PrintQueueID);
					addNewMailbag(serialNum,packageList);
					enteroutportDb.update({CurrentCount:0,CurrentWeight:0},{
						where:{
							EnterOutPortCode:port,Direction:direction,EnterOutPortType:'OUT'
						}
					});
					scanPackageDb.update({PrintQueueID:printQueue.PrintQueueID},{
						where:{
							ExitPort:port,
							ExitDirection:direction,
							PrintQueueID:null,
							FinishDate:{ne:null}
						}
					});

				}
			});
		}
	});
}


function addNewMailbag(operationSerialNumber,packageList){
	var trackingNos = packageList.join(',');
	var addNewMailbagOptions = {
		url: "http://sys.etg56.com/automationApi/addOutstorage",
		form: {
			"token": '10D4E746C69885D143E33D0C3108EA48',
			"trackingNos": trackingNos
		},
		method: 'POST'
	};

	loginRequest(addNewMailbagOptions, function (error, response, body) {
		if (body != null && body != undefined) {
			console.log('getobj:' + util.inspect(body));
			if (body.success == true){
				var data = body.data;
				printQueueDb.update({
					ErrorMsg:body.msg,
					PrintFlag:'1'
				},{
					where:{SerialNumber:operationSerialNumber}
				}).then(function (updateCount){
					StartPrintTask(operationSerialNumber);
				})
			}else if (body.success == false){
				printQueueDb.update({ErrorMsg:body.msg,PrintFlag:'-1'},{
					where:{SerialNumber:operationSerialNumber}
				}).then(function (updateCount){
					StartPrintTask(operationSerialNumber);
				});
			}
		}else{
			logger.info('add new mailbag return null');
		}
	});
}

function StartPrintTask(operationSerialNumber){
	printQueueDb.findOne({
		where:{SerialNumber:operationSerialNumber}
	}).then(function (printTask){
		if (printTask != null && printTask != undefined) {
			console.log(printTask.baggingBatchNumber);
			postPrintData(printTask.OutPortCmd + '|' + printTask.Direction, printTask.baggingBatchNumber,
				printTask.mailBagNumber,printTask.CountryCode,printTask.Count,printTask.Weight,
				printTask.barcodeContent,printTask.ErrorMsg,printTask.labelHtml);

			printQueueDb.update({PrintFlag:2},{
				where:{SerialNumber:operationSerialNumber}
			});
		}
	});
}

function postPrintData(exit_No,Dispatch_No,Bag_No,Country,Count,Weight,barCodeContent,errMsg,labelHtml){
	LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
	LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

	LODOP.PRINT_INIT("label task");               //首先一个初始化语句
	LODOP.SET_PRINT_PAGESIZE(0,950,950,0);
	LODOP.SET_PRINT_STYLE('fontsize',12);
	LODOP.SET_PRINT_STYLE('bold',12);

	LODOP.ADD_PRINT_TEXT(30,40,160,20,"出口号:");//然后多个ADD语句及SET语句
	LODOP.ADD_PRINT_TEXT(30,150,300,20, exitNo);//然后多个ADD语句及SET语句

	LODOP.ADD_PRINT_TEXT(50,40,160,20,"数量:");
	LODOP.ADD_PRINT_TEXT(50,150,300,20, count);


	LODOP.ADD_PRINT_TEXT(70,40,160,20,"重量:");
	LODOP.ADD_PRINT_TEXT(70,150,300,20,weight);


	if (errMsg != null) {
		LODOP.ADD_PRINT_TEXT(90, 40, 350, 20, '封包错误:' + errMsg);
	}

	LODOP.ADD_PRINT_BARCODE(140,10,350,60,'128B',barCodeContent);

	LODOP.PRINT();
}




//addNewMailbag(100011,['RS621435976CN','RS621438907CN']);

module.exports.bdtGetExit = bdtGetExit;
module.exports.bdtPushWeight = bdtPushWeight;
module.exports.addNewMailbag = addNewMailbag;
module.exports.Print = DoPrint;
//bdtPushWeight('RT371971038HK',0.2,"zb_opr");
//setTimeout(test,2000);