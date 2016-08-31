/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_scanpackage', {
    ScanPackageID: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
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
      type: DataTypes.INTEGER,
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
    Logs: {
      type: DataTypes.STRING,
      allowNull: true
    },
    BufStr: {
      type: DataTypes.STRING,
      allowNull: true
    },
    FinishDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: '0000-00-00 00:00:00'
    },
    UploadDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: '0000-00-00 00:00:00'
    }
  }, {
    tableName: 'eq_scanpackage'
  });
};
