/**
 * Created by Administrator on 2016-10-28.
 */
var express = require('express');
var router = express.Router();
var util = require('util');

var sortSiteDb = require('../models').siteexitport;


/* GET users listing. */
router.get('/list', function(req, res, next) {
  var page = req.query.page;
  var rows = req.query.rows;
  if (page === undefined || rows === undefined) {
    sortSiteDb.findAll().then(function (allData) {
      res.json({total: allData.length, rows: allData});
    }).catch(function (err) {
      res.json({status: false, msg: err});
    });
  }else{
    var rowCount = parseInt(rows);
    var pageIndex = parseInt(page)
    var offset = rowCount*(pageIndex-1);
    sortSiteDb.findAndCountAll({
      limit:rowCount,
      offset:offset
    }).then(function (allData) {
      console.log("alldata:"+util.inspect(allData));
      res.json({total: allData.count, rows: allData.rows});
    }).catch(function (err) {
      console.log("error:"+util.inspect(err));
      res.json({status: false, msg: err});
    });
  }

});


router.post('/save', function(req, res, next) {
  var reqObj = req.body;
  //console.log (reqObj);
  console.log(util.inspect(reqObj));
  var retObj = {};

  sortSiteDb.upsert(reqObj).then(function(){
    retObj.status = true;
    retObj.message = "更新成功";
    res.json(retObj);
  }).catch(function(err){
    retObj.status = false;
    retObj.message = "更新失败:"+err;
    res.json(retObj);
  });
});

router.post('/delete', function(req, res, next) {
  var reqObj = req.body;
  //console.log (reqObj);
  console.log(util.inspect(reqObj));
  var retObj = {};

  sortSiteDb.destroy({where:{id:reqObj.id}}).then(function(){
    retObj.status = true;
    retObj.message = "删除成功";
    res.json(retObj);
  }).catch(function(err){
    retObj.status = false;
    retObj.message = "删除失败:"+err;
    res.json(retObj);
  });
});


router.get('/nextid', function(req, res, next) {
  var retObj = {};
  sortSiteDb.max('id').then(function(max){
    retObj.id = max+1;
    res.json(retObj);
  });
});
module.exports = router;
