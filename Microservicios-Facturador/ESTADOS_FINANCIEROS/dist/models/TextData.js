"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextData = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class TextData extends sequelize_1.Model {
}
exports.TextData = TextData;
TextData.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    itemPdfId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    subtitulo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    contenido: {
        type: sequelize_1.DataTypes.TEXT("long"),
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "TextData",
    tableName: "TextData",
    timestamps: false,
});
exports.default = TextData;
