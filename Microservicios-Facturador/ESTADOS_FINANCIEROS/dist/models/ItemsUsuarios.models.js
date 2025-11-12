"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsUsuarios = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ItemsUsuarios extends sequelize_1.Model {
}
exports.ItemsUsuarios = ItemsUsuarios;
ItemsUsuarios.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    usuarioID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    itemID: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    peso: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    calificacionItem: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    cumplimiento: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "ItemsUsuarios",
    tableName: "ItemsUsuarios",
    timestamps: false,
});
exports.default = ItemsUsuarios;
