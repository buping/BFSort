/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('pr_serialnumber', {
    SerialNumber: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'pr_serialnumber'
  });
};
