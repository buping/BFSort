var express = require('express');
var router = express.Router();
var WeigthScale = require('../WeightScale.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  var retObj = {};
  if (WeigthScale.working !== undefined){
	  retObj.weight = WeigthScale.working.GetWeight();
  }
  res.json(retObj);
});

module.exports = router;
