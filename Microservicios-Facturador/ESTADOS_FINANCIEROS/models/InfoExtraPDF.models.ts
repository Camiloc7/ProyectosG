import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface InfoExtraPDFAttributes {
  id: string;
  pdfID: string;
  subtitulo: string;
  contenido: string;
  poscicion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InfoExtraPDFCreationAttributes
  extends Optional<InfoExtraPDFAttributes, "id"> {}

export class InfoExtraPDF
  extends Model<InfoExtraPDFAttributes, InfoExtraPDFCreationAttributes>
  implements InfoExtraPDFAttributes
{
  public id!: string;
  public pdfID!: string;
  public subtitulo!: string;
  public contenido!: string;
  public poscicion!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InfoExtraPDF.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pdfID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subtitulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    poscicion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "InfoExtraPDF",
    tableName: "InfoExtraPDF",
    timestamps: true,
  }
);

export default InfoExtraPDF;
