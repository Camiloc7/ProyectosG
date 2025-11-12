"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirmaData = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class FirmaData extends sequelize_1.Model {
}
exports.FirmaData = FirmaData;
FirmaData.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    itemPdfId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    cargo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "FirmaData",
    tableName: "FirmaData",
    timestamps: false,
});
exports.default = FirmaData;
