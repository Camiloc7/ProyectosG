"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDF = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class PDF extends sequelize_1.Model {
}
exports.PDF = PDF;
PDF.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    usuarioID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    codigo: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    itemID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    titulo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    fechaCreacion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    fechaActualizacion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    urlPDF: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    versionDocumento: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "PDF",
    tableName: "PDF",
    timestamps: true,
    updatedAt: "fechaActualizacion",
    createdAt: "fechaCreacion",
});
exports.default = PDF;
