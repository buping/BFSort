/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_channel', {
    ChannelID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
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
    tableName: 'ba_channel'
  });
};
