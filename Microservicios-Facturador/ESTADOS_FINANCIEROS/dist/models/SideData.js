"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SideData = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SideData extends sequelize_1.Model {
}
exports.SideData = SideData;
SideData.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    SeccionPdfID: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "seccionPdfId", // nombre real en la tabla
    },
    contenido: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    etiqueta: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    poscicion: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "SideData",
    tableName: "SideData",
    timestamps: false,
});
exports.default = SideData;
