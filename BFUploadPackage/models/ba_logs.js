/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_logs', {
    LogsID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    Operator: {
      type: DataTypes.STRING,
      allowNull: true
    },
    LogMsg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    OperatorDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: 'CURRENT_TIMESTAMP'
    }
  }, {
    tableName: 'ba_logs'
  });
};
