const rest=require('restler');

const serverUrl = "http://www.360chain.com:8086/xms_hly";
const packageBagUrl = "/client/packageBag.htm";
const getBagInfoUrl = "/client/getBagInfo.htm";
const userToken = "8a3ddab172a74ad887be919a2aa41641";
const msgId = "4dad4e274da5fc536009fb49b37e1be4";

function PrintYlhd(){

}

/*
  send package command to ylhd server
    @orders  array of all barcode to package in the bag
    @msgId   id of the msg to send during this request

    return Promise of the job finished
 */
PrintYlhd.PackageBag=function(orders,msgId,cb,err){
  var requestObj={};

  requestObj.userToken = userToken;
  requestObj.msgId = msgId;
  requestObj.orderInfo = {};
  requestObj.orderInfo.count = orders.length;
  requestObj.orderInfo.orders = orders;

  console.log(requestObj);

  rest.postJson(serverUrl+packageBagUrl,requestObj).on("complete",function(retObj){
    cb(retObj);
  });
};

PrintYlhd.GetBagInfo=function(bagId,msgId,cb,err){
  var requestObj={};

  requestObj.userToken = userToken;
  requestObj.msgId = msgId;
  requestObj.bagInfo = {};
  requestObj.bagInfo.bagId = bagId;

  console.log(requestObj);

  rest.postJson(serverUrl+getBagInfoUrl,requestObj).on("complete",function(retObj){
    cb(retObj);
  });
};

PrintYlhd.NewMsgID = function(){
  var msgIdBuf = new Buffer[16];
  for (var i=0;i<16;i++){
    msgIdBuf[i] = Math.floor(Math.random(256));
  }

  var msgId = msgIdBuf.tostring('hex');
  return msgId;
};

PrintYlhd.Test = function(){
  var orders  = [];
  orders.push("2016092700001");
  orders.push("2016092700003");
  orders.push("2016092700004");

  PrintYlhd.PackageBag(orders,msgId,function(retObj){
    console.log("packagebag:"+retObj);
  });

  PrintYlhd.GetBagInfo(17,msgId,function(retObj){
    console.log("baginfo:"+retObj);
  });

};


module.exports = PrintYlhd;