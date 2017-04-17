/**
 * Created by Administrator on 2017-01-17.
 */

const rest = require('restler');
const uuid = require('uuid');

var request = require('request');
var qs = require('querystring');
var util = require('util');
var logger = require('../log.js').logger;

var printQueueDb = require('../models').ba_printqueue;
var printQueueDb = require('../models').ba_printqueue;
var pr_serialDb = require('../models').pr_serialnumber;
var scanPackageDb = require('../models').eq_scanpackage;
var sequelize = require('sequelize');

var LODOP = require('../CLodopfuncs.js');



var loginPage = 'http://219.132.153.254:8222/checkLogin';
var loginUser = 'ty1003';
var loginPass = '10566';
var loginHeader = 'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:49.0) Gecko/20100101 Firefox/49.0';
var getInfoPage = 'http://219.132.153.254:8222/wsRecWaybill/checkCoOrder/';
var loginSuccPage = 'http://219.132.153.254:8222/index';

var loginRequest = request.defaults({jar: true});   //login every 10 minutes
var loginSucc = false;




var loginOptions = {
  url: loginPage,
  form: {
    "username": loginUser,
    "pwd": loginPass
  },
  method: 'POST',
  headers: loginHeader
};


var ylhdLogin = function () {
  loginRequest(loginOptions, function (error, response, body) {
    if (response === undefined) {
      loginSucc = false;
      console.log('login to ylhd error,relogin in 5 seconds');
      setTimeout(ylhdLogin, 5000);
      return;
    }

    console.log(response.statusCode);
    console.log(response.headers.location);
    var location = response.headers.location;
    console.log(typeof location);
    if (!error && response.statusCode == 302 &&
      location.startsWith(loginSuccPage)) {
      console.log('login to ylhd successful.');
      loginSucc = true;

      setTimeout(ylhdLogin, 1000 * 60 * 10);    //relogin after 30 minutes
    } else {
      loginSucc = false;
      console.log('login to ylhd error,relogin in 5 seconds');
      setTimeout(ylhdLogin, 5000);
    }
    //console.log(response.headers);
  });
};


var userToken = '54b44cf2290049a597bfda2871d319f8';
var getExitNumUrl = 'http://120.76.26.53:8086/xms/client/getExitNum.htm';
var getPackageInfo = function (barCode, cb) {
  var postObj = {userToken: userToken, wno: barCode, station: 100};
  console.log(JSON.stringify(postObj));
  rest.postJson(getExitNumUrl, postObj).on('complete', function (retStr) {
    console.log(retStr);
    var retObj = JSON.parse(retStr);
    if (retObj != null && retObj != undefined) {
      cb(retObj.portNumber);
    }
  }).on('error', function (err, response) {
    cb(null, err);
  });
}
/*
var getPackageInfo = function (barCode, cb) {
  if (!loginSucc) {
    cb({});
    return;
  }

  var getPackageInfo = {
    url: getInfoPage + barCode,
    method: 'GET',
    headers: loginHeader
  };

  loginRequest(getPackageInfo, function (error, response, body) {
    try {
      var infoObj = JSON.parse(body);
      //console.log(body);
      //submitScanResult(barCode,infoObj,infoObj.predictionweight);
      cb(infoObj);
    } catch (e) {
      console.log('error in login request parse json: ' + e);
    }
  });
};
*/

var getPackagesInfo = function (barCode, cb) {
  if (!loginSucc) {
    cb({});
    return;
  }

  var getPackageInfo = {
    url: getInfoPage + barCode,
    method: 'GET',
    headers: loginHeader
  };

  loginRequest(getPackageInfo, function (error, response, body) {
    try {
      var infoObj = JSON.parse(body);
      //console.log(body);
      //submitScanResult(barCode,infoObj,infoObj.predictionweight);
      cb(infoObj);
    } catch (e) {
      console.log('error in login request parse json: ' + e);
    }
  });
};


var getExitNumExtraUrl = 'http://kd.szice.net:8087/xms/client/getExitNum.htm';
var extraUserToken = '0ee02d147f1e4cbc882e3fd42e826f2c';
var extraStation = '2';

var getPackageInfoExtra = function (barCode, cb) {
  var postObj = {userToken: extraUserToken, wno: barCode, station: extraStation};

  rest.postJson(getExitNumExtraUrl, postObj).on('complete', function (retStr) {
    var retObj = JSON.parse(retStr);
    if (retObj != null && retObj != undefined) {
      cb(retObj.portNumber);
    }
  }).on('error', function (err, response) {
    cb(null, err);
  });

};


//ylhdLogin();

function testGet() {
  getPackageInfo('LAOYL1001517667YQ', function (data) {
    console.log(data);
    if (data.success && data.map.dest != undefined) {
      var dest = data.map.dest;
      if (dest.printArea) {
        console.log('Exitport of ' + data.map.order.wno + ' is ' + dest.printArea);
      } else {
        console.log('no exitport')
      }

    } else {
      console.log('no map.dest');
    }
  });
}

var packageBagUrl = 'http://kd.szice.net:8089/xms/client/packageBag.htm';
function addNewMailbag(operationSerialNumber, packageList) {
  var newUuid = uuid.v1();
  var msgId = newUuid.replace(new RegExp(/-/g),'');
  console.log('uuid:'+msgId);
  var postData = {
    userToken: extraUserToken,
    msgId:msgId,
    orderInfo: {
      orders: packageList,
      count: packageList.length
    }
  };

  console.log(JSON.stringify(postData));
  rest.postJson(packageBagUrl, postData).on('complete', function (retStr) {
    try{
      var body = JSON.parse(retStr);
      console.log('getobj:' + util.inspect(body));
      if (body.result == "success") {
        var data = body.bagInfo;
        printQueueDb.update({
          baggingBatchNumber: data.bagId,
          mailBagNumber: data.bagCode,
          sortingCode: data.outChannel,
          barcodeContent: data.bagCode,
          labelHtml:data.mailBagLabelHtml,
          PrintFlag: '1'
        }, {
          where: {SerialNumber: operationSerialNumber}
        }).then(function (updateCount) {
          StartPrintTask(operationSerialNumber);
        })
      } else if (body.result == "fail") {
        printQueueDb.update({ErrorMsg: body.msg, PrintFlag: '-1'}, {
          where: {SerialNumber: operationSerialNumber}
        }).then(function (updateCount) {
          StartPrintTask(operationSerialNumber);
        });
      }
    } catch (err) {
      console.log('add new mailbag return null');
    }
  });
}


var getBagUrl = 'http://kd.szice.net:8089/xms/client/getBagInfo.htm';

function getNewMailbag(bagId,cb) {
  var postData = {
    userToken: extraUserToken,
    bagInfo: {
      bagId: bagId
    }
  };

  console.log(JSON.stringify(postData));
  rest.postJson(getBagUrl, postData).on('complete', function (retStr) {
    try{
      var body = JSON.parse(retStr);
      console.log('getobj:' + util.inspect(body));
      cb(body);
    } catch (err) {
      console.log('add new mailbag return null');
    }
  });
}
//setInterval(testGet,2000);


function DoPrint(port,direction){
  pr_serialDb.update({
    SerialNumber: sequelize.literal('SerialNumber +1')
  },{
    where:{}
  }).then(function (myval) {
    pr_serialDb.findOne().then(function (newval) {
      console.log("using serial number"+newval.SerialNumber);
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


function postPrintData(exit_No,Dispatch_No,Bag_No,Country,Count,Weight,barCodeContent,errMsg,errPkgList,labelHtml){
  LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
  LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

  LODOP.PRINT_INIT("label task");               //首先一个初始化语句
  LODOP.SET_PRINT_PAGESIZE(0,950,950,0);
  LODOP.SET_PRINT_STYLE('fontsize',12);
  LODOP.SET_PRINT_STYLE('bold',12);

  LODOP.ADD_PRINT_TEXT(10,40,160,20,"exit_No:");//然后多个ADD语句及SET语句
  LODOP.ADD_PRINT_TEXT(10,150,300,20, exit_No);//然后多个ADD语句及SET语句


  if (errMsg != null) {
    LODOP.ADD_PRINT_TEXT(30, 40, 350, 20, '封包错误:' + errMsg);
  }

  LODOP.ADD_PRINT_HTML(50,40,600,600,labelHtml);

  LODOP.PRINT();
}


function StartPrintTask(operationSerialNumber){
  printQueueDb.findOne({
    where:{SerialNumber:operationSerialNumber}
  }).then(function (printTask){
    if (printTask != null && printTask != undefined) {
      console.log(printTask.baggingBatchNumber);
      postPrintData(printTask.OutPortCmd + '|' + printTask.Direction, printTask.baggingBatchNumber,
        printTask.mailBagNumber,printTask.CountryCode,printTask.Count,printTask.Weight,
        printTask.barcodeContent,printTask.ErrorMsg,printTask.errPkgList,printTask.labelHtml);

      printQueueDb.update({PrintFlag:2},{
        where:{SerialNumber:operationSerialNumber}
      });
    }
  });
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
    }else{
      PrintNullPage(port,direction,serialNum);
    }
  });
}

function PrintNullPage(port,direction,serialNum){
  LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
  LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

  LODOP.PRINT_INIT("label task");               //首先一个初始化语句
  LODOP.SET_PRINT_PAGESIZE(0,950,950,0);
  LODOP.SET_PRINT_STYLE('fontsize',12);
  LODOP.SET_PRINT_STYLE('bold',12);

  LODOP.ADD_PRINT_TEXT(10,40,160,20,"出口号:");//然后多个ADD语句及SET语句
  LODOP.ADD_PRINT_TEXT(10,150,300,20, port + "|" + direction);//然后多个ADD语句及SET语句



  LODOP.ADD_PRINT_TEXT(30, 40, 350, 20, '出口无数据');
  LODOP.PRINT();

}

module.exports.getPackageInfo = getPackageInfo;
module.exports.getPackagesInfo = getPackagesInfo;
module.exports.getPackageInfoExtra = getPackageInfoExtra;
module.exports.DoPrint = DoPrint;
module.exports.addNewMailbag = addNewMailbag;
module.exports.getNewMailbag = getNewMailbag;