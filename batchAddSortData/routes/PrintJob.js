var express = require('express');
var router = express.Router();

var util = require('util');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug=require('debug')('sortdata');

var Sequelize = require('sequelize');

var sequelize = new Sequelize('bfsort','bfsort','bfsorting',{
    host: 'localhost',
    dialect: 'mysql',
    pool:{
        max:5,
        min:0,
        idle:10000
    },
});


var printJobData = sequelize.define('Ba_PrintQueue',{
    PrintQueueID:{
        type:Sequelize.INTEGER,
        unique: true,
        primaryKey: true
    },
    PrintQueueName:{
        type:Sequelize.STRING(50)
    },
    OutPortCmd:{
        type:Sequelize.STRING(20)
    },
    Direction:{
        type:Sequelize.STRING(2)
    },
    PrintFileName:{
        type:Sequelize.STRING(20)
    },
    Count:{
        type:Sequelize.INTEGER
    },
    Weight:{
        type:Sequelize.DECIMAL(18,3)
    },
    SerialNumber:{
        type:Sequelize.STRING(20)
    },
    baggingBatchNumber:{
        type:Sequelize.STRING(50)
    },
    mailBagNumber:{
        type:Sequelize.STRING(50)
    },
    sortingCode:{
        type:Sequelize.STRING(50)
    },
    barcodeContent:{
        type:Sequelize.STRING(50)
    },
    CountryCode:{
        type:Sequelize.STRING(10)
    },
    ErrorMsg:{
        type:Sequelize.STRING(500)
    },
    PrintFlag:{
        type:Sequelize.STRING(10)
    },
    CreateDate:{
        type:Sequelize.DATE()
    },
    
},{
    freezeTableName:true
});

printJobData.sync().then(function(){

    return printJobData.upsert({
        PrintQueueID:'17',
        PrintQueueName:'20160810081446250',
        OutPortCmd:'981',
        Direction:'1',
        PrintFileName:'PrintFile1.frx',
        Count:99,
        Weight:12.374,
        SerialNumber:'1000002876',
        baggingBatchNumber:'SYL1566-VP-EMD',
        mailBagNumber:'SYLJ0003',
        sortingCode:'981|1',
        barcodeContent:'SYL1566-VP-EMD SYLJ0003',
        CountryCode:'RU',
        PrintFlag:'0',
        CreateDate:'2016-08-10 14:58:48.677'
    });
});


/* GET users listing. */
router.get('/get', function(req, res, next) {
	printJobData.findOne().then(function(printJob){
		var retObj = new Object();
		retObj.Ba_PrintQueue = new Array();
		retObj.Ba_PrintQueue[0] = printJob;
		res.send(retObj);
		//res.send(printJob);
	});
});

router.get('/finish/:id', function(req, res, next) {
	var queueId = req.params.id;
	
	printJobData.findOne().then(function(printJob){
		var retObj = new Object();
		retObj.Ba_PrintQueue = new Array();
		retObj.Ba_PrintQueue[0] = printJob;
		res.send(retObj);
		//res.send(printJob);
	});
});

module.exports = router;
