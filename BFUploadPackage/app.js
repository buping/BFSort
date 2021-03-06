var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('bfsort');
var util = require('util');

var EnterPort = require('./EnterPort.js');
var ExitPort = require("./ExitPort.js");
var ExitButton = require("./ExitButton.js");
var WeightScale = require('./WeightScale.js');

var logger = require('./log.js').logger;
logger.setLevel('INFO');

var routes = require('./routes/index');
var users = require('./routes/users');
var sendfj = require('./routes/sendfj');
var admin = require('./routes/admin');
var weight = require('./routes/weight')
var exitportdata = require('./routes/exitportdata');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Accept,Content-Type,_ajax_");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/exitportdata', exitportdata);
app.use('/sendfj',sendfj);
app.use('/ping',sendfj.ping);
app.use('/status',sendfj.status);
app.use('/getscan',sendfj.getscan);
app.use('/admin',admin);
app.use('/weight',weight);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var models = require('./models');
models.sequelize.sync().then(function (){
  debug("models synced")
});

var SerialPort = require('serialport');
console.log('List all serialport');
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});

var bfstatus = require('./BFStatus.js');
bfstatus.StartHeartBeat();

var bfConfig = require ('./config/bfconfig.json');

if (bfConfig.EnterPort !== undefined){
  EnterPort.working = new EnterPort(bfConfig.EnterPort);
  EnterPort.working.Init();
}



if (bfConfig.ExitPort !== undefined){
  ExitPort.working = new ExitPort(bfConfig.ExitPort);
  ExitPort.working.Init();
}

if (bfConfig.ExitButton !== undefined){
  ExitButton.working = new ExitButton(bfConfig.ExitButton);
  ExitButton.working.Init();
}

if (bfConfig.WeightScale !== undefined){
  WeightScale.working = new WeightScale(bfConfig.WeightScale);
  WeightScale.working.Init();
}


if (bfConfig.TriggerPort !== undefined){

  var TriggerPort = require('./TriggerPort.js');

  TriggerPort.working = new TriggerPort(bfConfig.TriggerPort);
  TriggerPort.working.Init();
}

if (bfConfig.Vitronic !== undefined){
  var Vitronic = require('./vitronic.js');


  Vitronic.working = new Vitronic(bfConfig.Vitronic);
  Vitronic.working.Init();
}

if (bfConfig.Datalogic !== undefined){
  var Datalogic = require('./datalogic.js');


  Datalogic.working = new Datalogic(bfConfig.Datalogic);
  Datalogic.working.Init();
}


if (bfConfig.DestPort !== undefined){
  var DestPort = require('./DestPort.js');

  DestPort.working = new DestPort(bfConfig.DestPort);
  DestPort.working.Init();

  if (TriggerPort.working !== undefined  && Datalogic.working !== undefined){
    TriggerPort.working.on("triggered",function(parcel){
      //console.log("got trigger,write after 3 seconds."+util.inspect(parcel));
      DestPort.working.enqueue(parcel);
      Datalogic.working.enqueue(parcel);
    });
    Datalogic.working.on("scan",function(dest){
      if (DestPort.working !== undefined){
        DestPort.working.receiveScan(dest);
      }
    });
  }

}

module.exports = app;