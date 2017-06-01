var ylhd = require('./client/ylhd.js');
var util = require('util');
var LODOP = require('./CLodopfuncs.js');

function test(){ 
	var now = Date.now();
	ylhd.getPackageInfo('LAOCC1000039241YQ',function(info){
		console.log('test for package');
		console.log(info);
	});
}

function test2(){
	ylhd.getPackageInfoExtra('RT373375475HK',function(retObj){
		console.log(retObj);
	});
}

function test3(){
	var operationSerialNumber = 10001;
	var packageList=['1Z3YY990YW17993530'];

	ylhd.addNewMailbag(operationSerialNumber,packageList);
}

function test4(){
	var bagId = 1200211793;

	ylhd.getNewMailbag(bagId,function(retObj){
		LODOP.SET_LICENSES("深圳市力得得力技术有限公司","EFBAA11B32E17DEF2AA21C83F683CA27","深圳市力得得力技術有限公司","26850A61F7A069ECABBDBA1CECCADC3B");
		LODOP.SET_LICENSES("THIRD LICENSE","","Shenzhen Leaddeal Technology Co., Ltd.","76FD901FAAAD2BD8354051606F79922D");

		LODOP.PRINT_INIT("label task");               //首先一个初始化语句
		LODOP.SET_PRINT_PAGESIZE(0,950,950,0);
		LODOP.SET_PRINT_STYLE('fontsize',12);
		LODOP.SET_PRINT_STYLE('bold',12);

		console.log(retObj.bagInfo.mailBagLabelHtml);
		LODOP.ADD_PRINT_HTML(0,0,950,950,retObj.bagInfo.mailBagLabelHtml);
		LODOP.PRINT();
	});
}
//setTimeout(test,2000);
test4();