"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Items = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const sequelize_2 = require("sequelize");
class Items extends sequelize_1.Model {
}
exports.Items = Items;
//Columna D del Exel
Items.init({
    id: {
        type: sequelize_2.INTEGER,
        primaryKey: true,
    },
    descripcionID: {
        //Aqui va el id de la descripcion a la que corresponde
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    valorItemEstandar: {
        //Columna E del Exel
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    actividad: {
        //El texto del item del estanda columna D Ej.(Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST)
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    codigo: {
        //los numeros de la columna D  ejemplo:(1.1.1)
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "Items",
    tableName: "Items",
    timestamps: true,
});
exports.default = Items;
