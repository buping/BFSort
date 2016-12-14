/**
 * Created by Administrator on 2016-08-30.
 */

var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;


function Command(instruction){
    this.packetHeader = INSTRUCTION_HEADER;
    this.instructionId = instruction;
    this.exitPortID = 0x0000;
    this.enterPortID = 0x00;
    this.serialNumber = 0x0000;
    this.reserved = 0x00;
    this.enterDirection = 0x00;
    this.exitDirection = 0x00;
    this.status = 0x00;
    this.checkSum = 0x00;

    this.isComplete = false;

    this.buffer = new Buffer(INSTRUCTION_LENGTH);
    this.isAllowRecieved = false;
    this.receivedCount = 0;
}

Command.PC_TO_EXIT = 0x01;
Command.EXIT_TO_PC = 0x04;
Command.PC_TO_ENTRY = 0x01;
Command.ENTRY_TO_PC = 0x03;

Command.BUTTON_TO_PC = 0x07;
Command.PC_TO_BUTTON = 0x01;
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
    this.buffer.fill(0);
    this.buffer[0] = this.packetHeader;
    this.buffer[1] = this.instructionId;
    this.buffer[2] = this.exitPortID%256;
    this.buffer[3] = this.exitPortID/256;
    this.buffer[4] = this.enterPortID % 256;
    this.buffer[5] = this.serialNumber % 256;
    this.buffer[6] = this.serialNumber / 256;
    this.buffer[7] = this.reserved;
    this.buffer[8] = this.enterDirection * 2 + this.exitDirection;
    this.buffer[9] = this.status;
    this.buffer[10] = CalcChecksum(this.buffer);
};

//todo
Command.prototype.FromBuffer = function(){
    this.packetHeader = this.buffer[0];
    this.instructionId = this.buffer[1];
    this.exitPortID = this.buffer[3]*256+this.buffer[2];
    this.enterPortID = this.buffer[4];
    this.serialNumber = this.buffer[6]*256+this.buffer[5];
    this.reserved = this.buffer[7];
    this.direction = this.buffer[8];
    this.exitDirection = this.buffer[8]%2;
    this.enterDirection = (this.buffer[8] & 0x02)/2;
    this.status = this.buffer[9];
};

//todo
Command.prototype.MakePcQueryExit = function (id,direction){

};

Command.prototype.RecieveDirect = function(){
    if (this.buffer[INSTRUCTION_LENGTH-1] == CalcChecksum(this.buffer)){
        this.FromBuffer();
        this.isComplete = true;
    }else{
        this.isComplete = false;
        this.Clear();
    }
};

Command.prototype.Clear = function(){
    this.isAllowRecieved = false;
    this.isComplete = false;
    this.receivedCount = 0;
};

Command.prototype.ReadData = function(data){
    if (data && data.length>0){
        for (var i=0;i<data.length;i++){
            if(data[i] == INSTRUCTION_HEADER && this.isAllowRecieved == false){
                this.receivedCount = 1;
                this.isAllowRecieved = true;
                this.buffer[0] = INSTRUCTION_HEADER;
            }else{
                if (this.isAllowRecieved) {
                    this.buffer[this.receivedCount++] = data[i];
                    if (this.receivedCount == INSTRUCTION_LENGTH) {
                        this.isAllowRecieved = false;
                        this.RecieveDirect();
                    }
                }
            }
        }
    }
}

Command.prototype.Clone = function(){
    return JSON.parse(JSON.stringify(this));
}

module.exports = Command;