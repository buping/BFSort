/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('wa_routerdetail', {
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
    ChannelID: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'wa_routerdetail'
  });
};
