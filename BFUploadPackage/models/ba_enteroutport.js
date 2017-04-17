/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_enteroutport', {
    EnterOutPortID: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    IsSelect: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EnterOutPortName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EnterOutPortCode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Direction: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    EnterOutPortType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Memo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    TodayCount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    TotalCount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    CurrentCount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    CurrentWeight: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    RunStatus: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Warning: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Note: {
      type: DataTypes.STRING,
      allowNull: true
    },
    IsMonitor: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ba_enteroutport'
  });
};
