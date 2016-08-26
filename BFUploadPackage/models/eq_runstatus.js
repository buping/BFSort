/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_runstatus', {
    RunStatusID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    PortName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PortType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Warning: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Note: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'eq_runstatus'
  });
};
