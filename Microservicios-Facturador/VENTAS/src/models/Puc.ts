import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database"; // Ajusta esta importación según tu configuración

export class Puc extends Model {
  public Codigo!: number;
  public Clave!: number;
  public Nombre!: string;
  public TIPO!: string;
  // Asegúrate de que estas propiedades estén tipadas correctamente
}

Puc.init(
  {
    Codigo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Clave: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TIPO: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Puc",
    tableName: "puc",
    timestamps: false,
  }
);
