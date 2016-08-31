var express = require('express');
var router = express.Router();
var models = require('../models');

/* GET home page. */
router.get('login', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;


    res.render('index', { title: 'Express' });
});

module.exports = router;
