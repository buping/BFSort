/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eq_routerdetail', {
    RouterDetailID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    RouterMainID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CountryCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CountryEnName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CountryZnName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ExitCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ExitName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Direction: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ChannelID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ChannelCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ChannelName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'eq_routerdetail'
  });
};
