/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_expirydate', {
    WaringDate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EndDate: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ba_expirydate'
  });
};
