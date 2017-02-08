/**
 * Created by Administrator on 2017-01-17.
 */
var request = require('request');
var util = require('util');
var logger = require('../log.js').logger;

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


var ylhdLogin = function(){
  loginRequest(loginOptions,function(error,response,body){
    console.log(response.statusCode);
    console.log(response.headers.location);
    var location = response.headers.location;
    console.log(typeof location);
    if (!error && response.statusCode == 302  &&
      location.startsWith(loginSuccPage)) {
      console.log('login to ylhd successful.');
      loginSucc = true;

      setTimeout(ylhdLogin,1000*60*10);    //relogin after 30 minutes
    }else {
      loginSucc = false;
      console.log('login to ylhd error,relogin in 5 seconds');
      setTimeout(ylhdLogin,5000);
    }
    //console.log(response.headers);
  });
};

var getPackageInfo = function(barCode,cb){
  if (!loginSucc){
    cb({});
    return;
  }

  var getPackageInfo = {
    url : getInfoPage+barCode,
    method: 'GET',
    headers: loginHeader
  };

  loginRequest(getPackageInfo,function(error,response,body){
    try {
      var infoObj = JSON.parse(body);
      //console.log(body);
      //submitScanResult(barCode,infoObj,infoObj.predictionweight);
      cb(infoObj);
    }catch (e){
      console.log('error in login request parse json: '+e);
    }
  });
};

ylhdLogin();

function testGet() {
  getPackageInfo('LAOYL1000191397YQ', function (data) {
    if (data.success && data.map.dest != undefined){
      var dest = data.map.dest;
      if (dest.printArea){
        console.log('Exitport is '+ dest.printArea);
      }else{
        console.log('no exitport')
      }

    }else{
      console.log('no map.dest');
    }
  });
}
setInterval(testGet,2000);
