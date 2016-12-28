/**
 * Created by Administrator on 2016-12-25.
 */
var sequelize = require('./models').sequelize;
sequelize.query('update ba_enteroutport set TodayCount=0,CurrentCount=0,CurrentWeight=0,RunStatus=1').then(
  function(results,metadata) {
    console.log('enter out port data reset');
  }
);

sequelize.query('insert into eq_scanpackagebak select * from eq_scanpackage').then(
  function(results,metadata){
    sequelize.query('delete from eq_scanpackage').then(
      function (results,metadata){
        console.log('moving scan package data to backup');
      }
    )
  });