var sunyouApi = require('../SunyouRequest.js');

function test() {
  //sunyouApi.getPackageInfo('SYHKA00004868', function (ret) {
  sunyouApi.getWeightedPackage('SYHKA00004868', function (ret) {
    console.log(ret);
  });
}

setTimeout(test,2000);