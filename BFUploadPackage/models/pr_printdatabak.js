/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('pr_printdatabak', {
    PrintDataBakID: {
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
      allowNull: true
    },
    PackageNum: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PrintNum: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'pr_printdatabak'
  });
};
