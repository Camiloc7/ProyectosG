import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface SideDataAttributes {
  id: string;
  SeccionPdfID: string;
  poscicion: number;
  contenido?: string;
  etiqueta?: string;
}

interface SideDataCreationAttributes
  extends Optional<SideDataAttributes, "id"> {}

export class SideData
  extends Model<SideDataAttributes, SideDataCreationAttributes>
  implements SideDataAttributes
{
  public id!: string;
  public SeccionPdfID!: string;
  public tipo!: string;
  public contenido?: string;
  public etiqueta?: string;
  public poscicion!: number;
}

SideData.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,

      primaryKey: true,
    },
    SeccionPdfID: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "seccionPdfId", // nombre real en la tabla
    },
    contenido: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    etiqueta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    poscicion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "SideData",
    tableName: "SideData",
    timestamps: false,
  }
);

export default SideData;
