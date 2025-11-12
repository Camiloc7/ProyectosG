import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { SeccionPDF } from "./SeccionPDF"; // o donde esté tu modelo

// Tipado opcional para campos autogenerados
interface PDFAttributes {
  id: string;
  usuarioID: number;
  itemID: number;
  versionDocumento: number;
  codigo: string;
  titulo: string;
  urlPDF?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Después: añadimos fechaCreacion y fechaActualizacion a la lista de opcionales
interface PDFCreationAttributes
  extends Optional<
    PDFAttributes,
    "id" | "createdAt" | "updatedAt" | "fechaCreacion" | "fechaActualizacion"
  > {}

export class PDF
  extends Model<PDFAttributes, PDFCreationAttributes>
  implements PDFAttributes
{
  public id!: string;
  public usuarioID!: number;
  public urlPDF!: string;
  public codigo!: string;
  public itemID!: number;
  public versionDocumento!: number;
  public titulo!: string;
  public fechaCreacion!: Date;
  public fechaActualizacion!: Date;
  public secciones?: SeccionPDF[]; // <-- aquí

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PDF.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaActualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    urlPDF: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    versionDocumento: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "PDF",
    tableName: "PDF",
    timestamps: true,
    updatedAt: "fechaActualizacion",
    createdAt: "fechaCreacion",
  }
);

export default PDF;
