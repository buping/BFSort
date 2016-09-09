/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_scanpackagebak', {
    ScanPackageID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ScanType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    SerialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ChannelCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    TrackNum: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CountryCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EnterPort: {
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
    PackageWeight: {
      type: 'DOUBLE',
      allowNull: true
    },
    CreateDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Logs: {
      type: DataTypes.STRING,
      allowNull: true
    },
    BufStr: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'eq_scanpackagebak'
  });
};
