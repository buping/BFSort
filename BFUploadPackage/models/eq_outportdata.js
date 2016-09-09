/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_outportdata', {
    OutPortDataID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    SerialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ExitPort: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Direction: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CreateDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    PrintQueueID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EnterPort: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'eq_outportdata'
  });
};
