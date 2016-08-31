/**
 * Created by Administrator on 2016/8/4.
 */


function PostPackage(barcode,channelCode,countryCode,countryCnName,packageWeight,portNumber) {
    if (!(this instanceof PostPackage)) {
        return new PostPackage();
    }
    this.barcode=barcode;
    this.channelCode=channelCode;
    this.countryCode=countryCode;
    this.countryCnName=countryCnName;
    this.packageWeight=packageWeight;
    this.PortNumber=portNumber;
    this.receiveTime = now();
    this.isFinished=false;
    this.finishTime=null;

    this.serialNum = 0;
    this.enterPort = 0;
    this.exitPort = 0;
    this.enterDirection = 0;
    this.exitDirection = 0;
}

PostPackage.prototype.Send=function(){

}

PostPackage.prototype.OnConfirmed=function(){

}

module.exports = PostPackage;