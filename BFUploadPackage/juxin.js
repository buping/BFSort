const net = require("net");
const logger = require('./log.js').logger;

function  Juxin() {
    
}

Juxin.prototype.init = function (cfg){
    this.addr = cfg.addr;
    this.port = cfg.port;
    this.isConnected = false;

    this.start();
}

Juxin.protype.start = function(){
    this.client = net.connect({host:this.addr,port:this.port},function(){
        this.isConnected = true;
        logger.info("conntect to juxin");
    });

    this.client.on("data",function (data){
        this.receiveData(data);
    }.bind(this));

    this.client.on("end",function(){
        this.isConnected = false;
        logger.info("juxin disconnected")
    });
}

Juxin.prototype.readData = function(data){
    this.lastData = data;
    var str = data.toString("ascii");
    var resArr = str.split("|");

    if (resArr[0] == "30"){  //data response
        var tunnelID = resArr[1];
        var packetID = resArr[2];
        var volumeData = resArr[3];
        var parcelCenter = resArr[4];
        var barCodeNum = resArr[5];
        var barCodes = resArr[6];

        var barCodeArr = barCodes.split(";");
        //todo
    }else if (resArr[0] == "40"){ //heartbeat response
        this.receiveHeatbeat();
    }
};

//todo
Juxin.prototype.receiveHeatbeat = function(){

};

Juxin.prototype.heatBeat = function(){
    if (this.isConnected)
        this.client.write("40|12|00000000");
    setTimeout(this.heatBeat().bind(this),15000);
}

module.exports = Juxin;