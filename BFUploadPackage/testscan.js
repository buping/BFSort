/**
 * Created by Administrator on 2017-05-10.
 */
var bdt = require('./testbdt.js');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {  // TODO: Log the answer in a database
  bdt.bdtGetExit(input,function(cb){
    console.log(cb);
  })
});
