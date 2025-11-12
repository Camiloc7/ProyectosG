"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seccion = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Seccion extends sequelize_1.Model {
}
exports.Seccion = Seccion;
Seccion.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
    },
    nombre: {
        //Columna B del Exel
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    ciclo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "Seccion",
    tableName: "Seccion",
    timestamps: true,
});
exports.default = Seccion;
