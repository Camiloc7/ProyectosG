import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface FirmaDataAttributes {
  id: string;
  itemPdfId: string;
  nombre: string;
  cargo: string;
}

interface FirmaDataCreationAttributes
  extends Optional<FirmaDataAttributes, "id"> {}

export class FirmaData
  extends Model<FirmaDataAttributes, FirmaDataCreationAttributes>
  implements FirmaDataAttributes
{
  public id!: string;
  public itemPdfId!: string;
  public nombre!: string;
  public cargo!: string;
}

FirmaData.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,

      primaryKey: true,
    },
    itemPdfId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "FirmaData",
    tableName: "FirmaData",
    timestamps: false,
  }
);

export default FirmaData;
