/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_country', {
    NID: {
      type: DataTypes.INTEGER(11),
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
    Area: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PY_Area: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ba_country'
  });
};
