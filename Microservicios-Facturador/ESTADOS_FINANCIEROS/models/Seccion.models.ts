import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface SeccionAttributes {
  id: number;
  nombre: string;
  ciclo: string;
}

interface SeccionCreationAttributes extends Optional<SeccionAttributes, "id"> {}

export class Seccion
  extends Model<SeccionAttributes, SeccionCreationAttributes>
  implements SeccionAttributes
{
  public id!: number;
  public nombre!: string;
  public ciclo!: string;
}

Seccion.init(
  {
    id: {
      type: DataTypes.INTEGER,      
      primaryKey: true,
    },
    nombre: {
      //Columna B del Exel
      type: DataTypes.STRING,
      allowNull: false,
    },

    ciclo: {      
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Seccion",
    tableName: "Seccion",
    timestamps: true,
  }
);

export default Seccion;
