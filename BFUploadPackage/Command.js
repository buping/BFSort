/**
 * Created by Administrator on 2016-08-30.
 */

var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;


function Command(){
    this.packetHeader = INSTRUCTION_HEADER;
    this.instructionId = 0x00;
    this.exitPortID = 0x0000;
    this.enterPortID = 0x00;
    this.serialNumer = 0x0000;
    this.reserved = 0x00;
    this.enterDirection = 0x00;
    this.exitDirection = 0x00;
    this.status = 0x00;
    this.checkSum = 0x00;

    this.isComplete = false;

    this.buffer = new Buffer[INSTRUCTION_LENGTH];
}

Command.PC_TO_EXIT = 0x01;
Command.EXIT_TO_PC = 0x04;
Command.PC_TO_ENTRY = 0x01;
Command.ENTRY_TO_PC = 0x03;

/*
 @return checksum
 */
function CalcChecksum(direct){
    var totalSum = 0;
    for(var i =0 ;i<(INSTRUCTION_LENGTH-1);i++){
        totalSum += direct[i];
    }
    return (totalSum%256);
}

//todo
Command.prototype.MakeBuffer = function(){
    var buf = this.buffer;
    buf.fill(0);
    buf[0] = this.packetHeader;
    buf[1] = this.instructionId;
    buf[2] = this.exitPortID%256;
    buf[3] = this.exitPortID/256;
    buf[4] = this.enterPortID % 256;
    buf[5] = this.serialNumer % 256;
    buf[6] = this.serialNumer / 256;
    buf[7] = this.reserved;
    buf[8] = this.enterDirection * 2 + this.exitDirection;
    buf[9] = this.status;
    buf[10] = CalcChecksum(buf);

    return buf;
};

//todo
Command.prototype.FromBuffer = function(){
}


Command.prototype.MakePcQueryExit = function (id,direction){

}

Command.prototype.ReadData = function(data){
    if (data && data.length>0){
        for (var i=0;i<data.length;i++){
            if(data[i] == INSTRUCTION_HEADER && this.isAllowRecieved == false){
                receivedCount = 1;
                this.isAllowRecieved = true;
            }else{
                if (this.isAllowRecieved) {
                    this.currentBuffer[receivedCount++] = data[i];
                    if (receivedCount == 11) {
                        this.isAllowRecieved = false;
                        this.recieveDirect();
                    }
                }
            }
        }
    }
}

module.exports = Command;