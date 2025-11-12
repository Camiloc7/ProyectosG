import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { ImageData } from "./ImageData"; // o donde esté tu modelo

export interface ItemPDFAttributes {
  id: string;
  SeccionPdfID: string;
  tipo: string;
  poscicion: number;
}

interface ItemPDFCreationAttributes extends Optional<ItemPDFAttributes, "id"> {}

export class ItemPDF
  extends Model<ItemPDFAttributes, ItemPDFCreationAttributes>
  implements ItemPDFAttributes
{
  public id!: string;
  public imagenes?: ImageData[];
  public SeccionPdfID!: string;
  public tipo!: string;
  public poscicion!: number;
}

ItemPDF.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,

      primaryKey: true,
    },
    SeccionPdfID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    poscicion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ItemPDF",
    tableName: "ItemPDF",
    timestamps: false,
  }
);

export default ItemPDF;
