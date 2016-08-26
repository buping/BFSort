/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_authorizeemployee', {
    AuthorizeEmployeeID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    SysMenuID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    ParentMenuID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'ba_authorizeemployee'
  });
};
