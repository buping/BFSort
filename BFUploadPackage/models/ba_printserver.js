/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_printserver', {
    PrintServerID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    PrintServerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PrintCommand: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PrintFile: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ba_printserver'
  });
};
