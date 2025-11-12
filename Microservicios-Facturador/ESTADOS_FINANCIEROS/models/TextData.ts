import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TextDataAttributes {
  id: string;
  itemPdfId: string;
  subtitulo: string;
  contenido: string;
}

interface TextDataCreationAttributes
  extends Optional<TextDataAttributes, "id"> {}

export class TextData
  extends Model<TextDataAttributes, TextDataCreationAttributes>
  implements TextDataAttributes
{
  public id!: string;
  public itemPdfId!: string;
  public subtitulo!: string;
  public contenido!: string;
}

TextData.init(
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
    subtitulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "TextData",
    tableName: "TextData",
    timestamps: false,
  }
);

export default TextData;
