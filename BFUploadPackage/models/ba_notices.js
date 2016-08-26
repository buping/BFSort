/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_notices', {
    NoitceID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    NoticeTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    NoticeLinks: {
      type: DataTypes.STRING,
      allowNull: true
    },
    NoticeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    IsUsed: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ba_notices'
  });
};
