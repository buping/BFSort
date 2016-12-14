var express = require('express');
var router = express.Router();

var ExitPort = require("../ExitPort.js");

/* GET users listing. */
router.get('/', function(req, res, next) {
	var working = ExitPort.working;
  working.GetExitPortData().then(function (allret){
  		res.json(allret);
  	}
  );
});

module.exports = router;
