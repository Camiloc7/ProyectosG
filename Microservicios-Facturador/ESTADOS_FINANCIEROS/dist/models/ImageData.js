"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageData = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ImageData extends sequelize_1.Model {
}
exports.ImageData = ImageData;
ImageData.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    itemPdfId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    altura: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    anchura: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "ImageData",
    tableName: "ImageData",
    timestamps: false,
});
exports.default = ImageData;
