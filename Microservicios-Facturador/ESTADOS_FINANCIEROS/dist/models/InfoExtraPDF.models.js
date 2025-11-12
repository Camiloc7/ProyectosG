"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoExtraPDF = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class InfoExtraPDF extends sequelize_1.Model {
}
exports.InfoExtraPDF = InfoExtraPDF;
InfoExtraPDF.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    pdfID: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    subtitulo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    contenido: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    poscicion: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "InfoExtraPDF",
    tableName: "InfoExtraPDF",
    timestamps: true,
});
exports.default = InfoExtraPDF;
