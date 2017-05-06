/**
 * Created by Administrator on 2017-05-06.
 */
var bfstatus = require('./BFStatus.js');

var count=0;
function test(){
  count++;
  var msg = "error"+count;
  console.log('send error report:'+msg);
  bfstatus.ReportError(0,msg);
}

setInterval(test,2000);
