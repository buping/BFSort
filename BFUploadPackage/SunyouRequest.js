var request = require('request');
var util = require('util');
var logger = require('./log.js').logger;

var loginPage = 'http://yw.sunyou.hk/admin/login';
var loginUser = 'beifen';
var loginPass = 'sy111111';
var loginHeader = 'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:49.0) Gecko/20100101 Firefox/49.0';
var getInfoPage = 'http://yw.sunyou.hk/admin/dailyoperation/sorting/weigh/scanPackage/getPackageInfo';
var submitScanPage = 'http://yw.sunyou.hk/admin/dailyoperation/sorting/weigh/scanPackage/submitScanResult';
var getPackagePage = 'http://yw.sunyou.hk/admin/dailyoperation/sorting/screen/getPackage';
var loginRequest = request.defaults({jar: true});   //login every 10 minutes
var loginSucc = false;

var loginOptions = {
  url: loginPage,
  form: {
    "username": loginUser,
    "password": loginPass
  },
  method: 'POST',
  headers: loginHeader
};


var scanCode = 'SYBAB07672838';


var sunyouLogin = function(){
  loginRequest(loginOptions,function(error,response,body){
    if (!error && response.statusCode == 302  &&
      response.headers.location == 'http://yw.sunyou.hk/admin') {
      logger.info('login to sunyou successful.');
      loginSucc = true;
      setTimeout(sunyouLogin,1000*60*30);    //relogin after 30 minutes
    }else {
      loginSucc = false;
      logger.error('login to sunyou error,relogin in 5 seconds');
      setTimeout(sunyouLogin,5000);
    }
    //console.log(response.headers);
  });
};

var getPackageInfo = function(barCode,cb){
  if (!loginSucc){
    cb({message:'登录后台系统中,请稍后再重新扫描.'});
    return;
  }

  var getPackageInfo = {
    url : getInfoPage,
    form: {
      "scanValue" : barCode,
      "channelId" : '',
      "companyId" : '',
      "channelLock" : '0',
      "organizationName" : '11'
    },
    method: 'POST',
    headers: loginHeader
  };

  loginRequest(getPackageInfo,function(error,response,body){
    try {
      if (body != undefined && body.length != undefined && body.length == 0) {
        loginSucc = false;
        cb({message:'登录后台系统中,请稍后再重新扫描.'});
        sunyouLogin();
        return;
      }

      var infoObj = JSON.parse(body);
      console.log(body);
      submitScanResult(barCode,infoObj,infoObj.predictionweight);
      cb(infoObj);
    }catch (e){
      cb({message:'获取包裹出口失败,请重新扫描'});
      logger.error('error in login request parse json:'+e);
    }
  });
};

var submitScanResult = function (barCode,packageInfo,weight){
  if (!loginSucc){
    return;
  }

  //console.log(util.inspect(packageInfo));

  var formData = {
    "packageId" : packageInfo.packageid,
    "packageCode" : packageInfo.packagecode,
    "trackingNumber" : packageInfo.trackingnumber,
    "companyName" : packageInfo.companyname,
    "globalOrganizationId" : 11,
    "companyId": packageInfo.companyId,
    "weightFlag": 1,
    "volumnFlag" : 0,
    "channelCode" : packageInfo.channelcode || '',
    "countryCode" : packageInfo.recipient_country_code,
    "countryCnName" : packageInfo.countrycnname,
    "portNumber" : packageInfo.sortingportnumber,
    "packagegreaterinterceptmode" : packageInfo.packagegreaterinterceptmode || '',
    "packagegreaterinterceptvalue" : packageInfo.packagegreaterinterceptvalue || '',
    "packagelesserinterceptmode" : packageInfo.packagelesserinterceptmode || '',
    "packagelesserinterceptvalue" : packageInfo.packagelesserinterceptvalue || '',
    "printFlag" : 0,
    "scanText" : barCode,
    "scanValue" : barCode,
    "weighingText" : weight,
    "weightValue" : weight,
    "volumeSelectLen" : 0,
    "volumeSelectWid" : 0,
    "volumeSelectHig" : 0
  };

  //console.log("formdata is "+util.inspect(formData));

  var submitScanInfo = {
    url : submitScanPage,
    form: formData,
    method: 'POST',
    //content-type : 'application/x-www-form-urlencoded; charset=UTF-8',
    headers: loginHeader
  };

  loginRequest(submitScanInfo,function(error,response,body){
    try{
      var infoObj = JSON.parse(body);
    }catch (e){
      logger.error('error in submit scan parse json ');
    }
    //console.log(infoObj);
    //console.log(response);
    //console.log(util.inspect(response.req._header));
      console.log("scan result:"+body);
  });
};


var getWeightedPackage = function(barCode,cb){
  if (!loginSucc){
    cb({});
    return;
  }

  var getPackageInfo = {
    url : getPackagePage,
    form: {
      "scanValue" : barCode,
      "channelId" : '',
      "channelLock" : '0',
      "labelFlag" : '0'
    },
    method: 'POST',
    headers: loginHeader
  };

  loginRequest(getPackageInfo,function(error,response,body){
    try {
      if (body != undefined && body.length != undefined && body.length == 0) {
        loginSucc = false;
        cb({message:'登录后台系统中,请稍后再重新扫描.'});
        sunyouLogin();
        return;
      }

      var infoObj = JSON.parse(body);
      console.log(body);
      cb(infoObj);
    }catch (e){
      logger.error('error in getPackageInfo parse json ');
    }
  });
};

var test = function(){
  getPackageInfo(scanCode,function(infoObj){
    console.log(infoObj);
  });
};

//setTimeout(sunyouLogin,10000);
sunyouLogin();


//var getMailbagInfoUrl = 'http://api.sandbox.sunyou.hk/autoSorting/getMaibagInfo';
var getMailbagInfoUrl = 'http://a2.sunyou.hk/autoSorting/getMaibagInfo';
var addNewMailbagUrl = 'http://a2.sunyou.hk/autoSorting/addNewMailbag';

var apiToken = '1CA135318B4C7053B1BDC13EB0855A22';
function getMaibagInfo(operationSerialNumber){
  var getParam = {
    url : getMailbagInfoUrl,
    body : {
      "apiSortingUserToken" : apiToken,
      "data":{
        "operationSerialNumber": operationSerialNumber
      }
    },
    method: 'POST',
    json : true,
    headers: loginHeader
  };

  request.post(getParam,function(error,response,body) {
    console.log('getobj:'+util.inspect(body));
  });

}

function addNewMailbag(operationSerialNumber,packageList){
  var postData = {
    "apiSortingUserToken" : apiToken,
    "data":{
      "operationSerialNumber": operationSerialNumber,
      "packageList":packageList
    }
  };

  console.log(JSON.stringify(postData));
  var getParam = {
    url : addNewMailbagUrl,
    body : postData,
    method: 'POST',
    json : true,
    headers: loginHeader
  };

  request.post(getParam,function(error,response,body) {
    if (body != null && body != undefined) {
      console.log('getobj:' + util.inspect(body));
      if (body.ack == "SUCCESS"){
        var data = body.data;
        printQueueDb.update({
          baggingBatchNumber:data.baggingBatchNumber,
          mailBagNumber:data.mailBagNumber,
          sortingCode:data.sortingCode,
          barcodeContent:data.labelData.barcodeContent,
          CountryCode:data.labelData.countryCode,
          Count:data.labelData.quantity,
          Weight:data.labelData.weight,
          ErrorMsg:body.errorMsg,
          errPkgList:JSON.stringify(data.errorPkgList),
          PrintFlag:'1'
        },{
          where:{SerialNumber:operationSerialNumber}
        }).then(function (updateCount){
          StartPrintTask(operationSerialNumber);
        })
      }else if (body.ack == "FAILURE"){
        printQueueDb.update({ErrorMsg:body.errorMsg,PrintFlag:'-1'},{
          where:{SerialNumber:operationSerialNumber}
        }).then(function (updateCount){
          StartPrintTask(operationSerialNumber);
        });
      }
    }else{
      console.log('add new mailbag return null');
    }
  });
}

function testPrint(){
  var operationSerialNumber = 1000004654;
  var a1 = {packageBarcode:'RQ096413845MY',packageSortingCode:'982|1'};
  var a2 = {packageBarcode:'RQ096406331MY',packageSortingCode:'982|1'};
  var packageList = [a1,a2];
  var postData = {
    "apiSortingUserToken" : apiToken,
    "data":{
      "operationSerialNumber": operationSerialNumber,
      "packageList":packageList
    }
  };

  //console.log(JSON.stringify(postData));
  var getParam = {
    url : addNewMailbagUrl,
    body : postData,
    method: 'POST',
    json : true,
    headers: loginHeader
  };

  console.log(JSON.stringify(postData));
  request.post(getParam,function(error,response,body) {
    console.log(body);
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


var printQueueDb = require('./models').ba_printqueue;
var pr_serialDb = require('./models').pr_serialnumber;
var scanPackageDb = require('./models').eq_scanpackage;
var enteroutportDb = require('./models').ba_enteroutport;
var sequelize = require('sequelize');
var LODOP = require('./CLodopfuncs.js');


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

function postPrintData(exit_No,Dispatch_No,Bag_No,Country,Count,Weight,barCodeContent,errMsg,errPkgList){
  LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
  LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

  LODOP.PRINT_INIT("label task");               //首先一个初始化语句
  LODOP.SET_PRINT_PAGESIZE(0,950,950,0);
  LODOP.SET_PRINT_STYLE('fontsize',12);
  LODOP.SET_PRINT_STYLE('bold',12);

  LODOP.ADD_PRINT_TEXT(10,40,160,20,"exit_No:");//然后多个ADD语句及SET语句
  LODOP.ADD_PRINT_TEXT(10,150,300,20, exit_No);//然后多个ADD语句及SET语句

  LODOP.ADD_PRINT_TEXT(30,40,160,20,"Dispatch No:");
  LODOP.ADD_PRINT_TEXT(30,150,300,20, Dispatch_No);


  LODOP.ADD_PRINT_TEXT(50,40,160,20,"Bag No:");
  LODOP.ADD_PRINT_TEXT(50,150,300,20,Bag_No);


  LODOP.ADD_PRINT_TEXT(70,40,160,20,"Country:");
  LODOP.ADD_PRINT_TEXT(70,150,300,20,Country);

  LODOP.ADD_PRINT_TEXT(90,40,160,20,"No.of pieces:");
  LODOP.ADD_PRINT_TEXT(90,150,300,20,Count);

  LODOP.ADD_PRINT_TEXT(110,40,160,20,"Weight:");
  LODOP.ADD_PRINT_TEXT(110,150,300,20,Weight + ' Kg');


  LODOP.ADD_PRINT_BARCODE(140,10,350,60,'128B',barCodeContent);

  if (errMsg != null) {
    LODOP.NewPageA();
    LODOP.ADD_PRINT_TEXT(10, 10, 350, 20, 'error:' + errMsg);
    try{
      var errList = JSON.parse(errPkgList);
      var errPkg;
      var height = 40;
      for (let errPkg of errList){
        LODOP.ADD_PRINT_TEXT(height,10,300,20,errPkg);
        height += 20;
      }
    }catch(err){}
  }
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
        printTask.barcodeContent,printTask.ErrorMsg,printTask.errPkgList);

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
    }
  });
}

module.exports.getPackageInfo = getPackageInfo;
module.exports.submitScanResult = submitScanResult;
module.exports.getWeightedPackage = getWeightedPackage;
module.exports.getMaibagInfo  = getMaibagInfo;
module.exports.addNewMailbag  = addNewMailbag;
module.exports.StartPrintTask = StartPrintTask;
module.exports.DoPrint  = DoPrint;
module.exports.sunyouLogin = sunyouLogin;
module.exports.testPrint = testPrint;