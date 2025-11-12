"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemPDF = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ItemPDF extends sequelize_1.Model {
}
exports.ItemPDF = ItemPDF;
ItemPDF.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    SeccionPdfID: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    tipo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    poscicion: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "ItemPDF",
    tableName: "ItemPDF",
    timestamps: false,
});
exports.default = ItemPDF;
