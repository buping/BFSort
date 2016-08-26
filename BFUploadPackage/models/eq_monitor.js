/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_monitor', {
    MonitorID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    EnterOutPortID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    EnterPort: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'eq_monitor'
  });
};
