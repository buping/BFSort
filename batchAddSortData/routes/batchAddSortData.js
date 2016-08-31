var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var sha1 = crypto.createHash('sha1');
var util = require('util');

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


var sortData = sequelize.define('sortData',{
    packageBarCode:{
        type:Sequelize.STRING
    },
    packageSite:{
        type:Sequelize.STRING
    }
},{
    freezeTableName:true
});

sortData.sync().then(function(){
    return sortData.create({
        packageBarCode:'100000111',
        packageSite:'001'
    });
});


var appsecret = 's7M#z34!f#%@$@Zwe$';

router.use(function(req, res, next) {
  console.log("query:" + req.query.appid);
  var appid=req.query.appid;
  var timestamp=req.query.timestamp;
  var signature=req.query.signature;

  var together = appid+appsecret+timestamp;
  console.log(together);
  sha1.update(together);
  var calsig=sha1.digest().toString('hex');
  if (calsig != signature){
    console.log("wrong signature,correct is "+calsig); 
  }else{
	console.log("right signature");
  }


  res.send('using post');
  next();
});

module.exports = router;
