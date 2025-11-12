"use strict";
//!EN ESTADISTICAS NUNCA SE HACE UPDATE SOLAMENTE INSERT (POST)
Object.defineProperty(exports, "__esModule", { value: true });
exports.Estadistica = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Estadistica extends sequelize_1.Model {
}
exports.Estadistica = Estadistica;
Estadistica.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    itemID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    fecha: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    calificacionCiclo: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    cumplimientoGeneral: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    tareasPendientes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    ActividadesEnProgreso: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    ActividadesFinalizadas: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "Estadistica",
    tableName: "Estadistica",
    timestamps: true,
});
exports.default = Estadistica;
