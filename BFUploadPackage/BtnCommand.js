/**
 * Created by Administrator on 2016-08-30.
 */

var INSTRUCTION_HEADER = 0xAA;
var INSTRUCTION_LENGTH = 11;


function BtnCommand(instruction) {
  this.packetHeader = INSTRUCTION_HEADER;
  this.instructionId = instruction;
  this.exitPortID = 0x0000;
  this.totalCount = 0x0000;
  this.totalWeight = 0x0000;
  this.exitStatus = 0x00;
  this.exitDirection = 0x00;
  this.cmdConfirm = 0x00;
  this.checkSum = 0x00;

  this.isComplete = false;

  this.buffer = new Buffer(INSTRUCTION_LENGTH);
  this.isAllowRecieved = false;
  this.receivedCount = 0;
}

BtnCommand.PC_TO_EXIT = 0x01;
BtnCommand.EXIT_TO_PC = 0x04;
BtnCommand.PC_TO_ENTRY = 0x01;
BtnCommand.ENTRY_TO_PC = 0x03;

BtnCommand.BUTTON_TO_PC = 0x07;
BtnCommand.PC_TO_BUTTON = 0x01;
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
BtnCommand.prototype.MakeBuffer = function(){
  this.buffer.fill(0);
  this.buffer[0] = this.packetHeader;
  this.buffer[1] = this.instructionId;
  this.buffer[2] = this.exitPortID%256;
  this.buffer[3] = this.exitPortID/256;
  this.buffer[4] = this.totalCount % 256;
  this.buffer[5] = this.totalCount / 256;
  this.buffer[6] = this.totalWeight % 256;
  this.buffer[7] = this.totalWeight / 256;
  this.buffer[8] = (this.exitDirection<<4) + this.exitStatus;
  this.buffer[9] = this.cmdConfirm;
  this.buffer[10] = CalcChecksum(this.buffer);
};

//todo
BtnCommand.prototype.FromBuffer = function(){
  this.packetHeader = this.buffer[0];
  this.instructionId = this.buffer[1];
  this.exitPortID = this.buffer[3]*256+this.buffer[2];
  this.exitDirection = this.buffer[8]>>4;
  this.cmdConfirm = this.buffer[9];
};

//todo
BtnCommand.prototype.MakePcQueryExit = function (id, direction){

};

BtnCommand.prototype.RecieveDirect = function(){
  if (this.buffer[INSTRUCTION_LENGTH-1] == CalcChecksum(this.buffer)){
    this.FromBuffer();
    this.isComplete = true;
  }else{
    this.isComplete = false;
    this.Clear();
  }
};

BtnCommand.prototype.Clear = function(){
  this.isAllowRecieved = false;
  this.isComplete = false;
  this.receivedCount = 0;
};

BtnCommand.prototype.ReadData = function(data){
  if (data && data.length>0){
    for (var i=0;i<data.length;i++){
      if(this.isAllowRecieved == false && data[i] == INSTRUCTION_HEADER  && data[i+1] == this.instructionId  ){
        this.receivedCount = 1;
        this.isAllowRecieved = true;
        this.buffer[0] = INSTRUCTION_HEADER;
        this.buffer[1] = this.instructionId;
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

BtnCommand.prototype.Clone = function(){
  return JSON.parse(JSON.stringify(this));
}

module.exports = BtnCommand;