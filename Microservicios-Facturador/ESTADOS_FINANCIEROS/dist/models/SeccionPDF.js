"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeccionPDF = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SeccionPDF extends sequelize_1.Model {
}
exports.SeccionPDF = SeccionPDF;
SeccionPDF.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    pdfID: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    poscicion: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "SeccionPDF",
    tableName: "SeccionPDF",
    timestamps: false,
});
exports.default = SeccionPDF;
