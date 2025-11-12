import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { INTEGER } from "sequelize";

export interface DescripcionAttributes {
  id: number;
  descripcion: string;
  calificacionSeccion: number;

  pesoPorcentual: number;
  seccionID: number;
}

interface DescripcionCreationAttributes
  extends Optional<DescripcionAttributes, "id"> {}

export class Descripcion
  extends Model<DescripcionAttributes, DescripcionCreationAttributes>
  implements DescripcionAttributes
{
  public id!: number;
  public descripcion!: string;
  public calificacionSeccion!: number;

  public pesoPorcentual!: number;
  public seccionID!: number;
}

Descripcion.init(
  {
    id: {
      type: INTEGER,      
      primaryKey: true,
    },
    descripcion: {
      //Columna C del Exel
      type: DataTypes.STRING,
      allowNull: false,
    },
    calificacionSeccion: {
      //Columna J del Exel
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pesoPorcentual: {
      //Columna F del Exel
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    //Aqui va el id de la seccion que corresponde
    seccionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Descripcion",
    tableName: "Descripcion",
    timestamps: true,
  }
);

export default Descripcion;
