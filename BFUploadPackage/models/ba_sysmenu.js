/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_sysmenu', {
    SysMenuID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    MenuName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ClassName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ExecuteType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ParentMenuID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    MenuLevel: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    ByOrder: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    Status: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'ba_sysmenu'
  });
};
