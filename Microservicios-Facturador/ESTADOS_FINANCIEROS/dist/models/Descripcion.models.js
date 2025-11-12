"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Descripcion = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const sequelize_2 = require("sequelize");
class Descripcion extends sequelize_1.Model {
}
exports.Descripcion = Descripcion;
Descripcion.init({
    id: {
        type: sequelize_2.INTEGER,
        primaryKey: true,
    },
    descripcion: {
        //Columna C del Exel
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    calificacionSeccion: {
        //Columna J del Exel
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    pesoPorcentual: {
        //Columna F del Exel
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    //Aqui va el id de la seccion que corresponde
    seccionID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "Descripcion",
    tableName: "Descripcion",
    timestamps: true,
});
exports.default = Descripcion;
