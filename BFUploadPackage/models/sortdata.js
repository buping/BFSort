/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sortdata', {
    packageBarcode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      primaryKey: true
    },
    packageSite: {
      type: DataTypes.STRING,
      allowNull: true
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
    tableName: 'sortdata'
  });
};
