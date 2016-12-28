/**
 * Created by Administrator on 2016-12-25.
 */

var ExitPort = require("../ExitPort");
var bfConfig = require ('../config/bfconfig.json');
var working = new ExitPort(bfConfig.ExitPort);

var cmd = {};
cmd.serialNumber =403;
cmd.enterPortID = 7;
cmd.exitPortID = 981;
cmd.exitDirection = 0;


working.SavePackage(cmd);