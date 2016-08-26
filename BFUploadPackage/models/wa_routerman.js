/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('wa_routerman', {
    RouterManID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    PlanName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Remark: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Status: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'wa_routerman'
  });
};
