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
	CartID: {
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
      type: DataTypes.INTEGER,
      allowNull: true
    },
    EnterDirection: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ExitPort: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ExitDirection: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    PackageWeight: {
      type: DataTypes.DECIMAL,
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
      allowNull: true
    },
    UploadDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    PrintQueueID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'eq_scanpackage'
  });
};
