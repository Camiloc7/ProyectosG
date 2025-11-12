import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ImageDataAttributes {
  id: string;
  itemPdfId: string;
  altura: number;
  anchura: number;
  key?: string;
  url: string;
}

interface ImageDataCreationAttributes
  extends Optional<ImageDataAttributes, "id"> {}

export class ImageData
  extends Model<ImageDataAttributes, ImageDataCreationAttributes>
  implements ImageDataAttributes
{
  public id!: string;
  public anchura!: number;
  public key?: string;
  public itemPdfId!: string;
  public altura!: number;
  public url!: string;
}

ImageData.init(
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
    altura: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anchura: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ImageData",
    tableName: "ImageData",
    timestamps: false,
  }
);

export default ImageData;
