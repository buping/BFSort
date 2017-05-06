/**
 * Created by Administrator on 2017-05-05.
 */
var LODOP = require('./CLodopfuncs.js');

function test(){
var count = LODOP.GET_PRINTER_COUNT();

for (var i=0;i<count;i++){
  console.log(LODOP.GET_PRINTER_NAME(i));
}

LODOP.SET_PRINTER_INDEX("打印机1");
}

setTimeout(test,3000);