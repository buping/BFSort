/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_employee', {
    EmployeeID: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    IsSelect: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeePwd: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeSex: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeePhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeQQ: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmployeeAddr: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Remark: {
      type: DataTypes.STRING,
      allowNull: true
    },
    IsAdmin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    CreateDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ba_employee'
  });
};
