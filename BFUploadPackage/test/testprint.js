var LODOP = require('../CLodopfuncs.js');


setTimeout(myprint,2000);
function myprint(){

  LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
  LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

  LODOP.PRINT_INIT("label task");               //首先一个初始化语句
  LODOP.SET_PRINT_PAGESIZE(0,950,950,0);

  LODOP.ADD_PRINT_TEXT(0,0,100,20,"文本内容一");//然后多个ADD语句及SET语句
LODOP.PRINT();

}