var sunyouApi = require('../SunyouRequest.js');


var packageList = [];
packageList.push({packageBarcode:'SYHKA00004778',packageSortingCode:'977|1'});

//packageList.push({packageBarcode:'SY10000452617',packageSortingCode:'950|1'});

//sunyouApi.addNewMailbag('1000000124',packageList);
//sunyouApi.getMaibagInfo('1000000123');

//sunyouApi.DoPrint(976,1);

//sunyouApi.getMaibagInfo('1000000123');

//sunyouApi.StartPrintTask('1000001892');

function test() {
  sunyouApi.sunyouLogin();
}

setInterval(test,5000);