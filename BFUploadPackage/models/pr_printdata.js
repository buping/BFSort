/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('pr_printdata', {
    PrintDataID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    TrackNum: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ExitCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CreateDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: 'CURRENT_TIMESTAMP'
    }
  }, {
    tableName: 'pr_printdata'
  });
};
