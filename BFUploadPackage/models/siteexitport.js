/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('siteexitport', {
    packageSite: {
      type: DataTypes.STRING,
      allowNull: false
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    exitPort: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'siteexitport'
  });
};
