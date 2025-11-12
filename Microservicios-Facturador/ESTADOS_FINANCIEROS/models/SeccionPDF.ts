import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { ItemPDF } from "./ItemsPDF"; // o donde esté tu modelo

export interface SeccionPDFAttributes {
  id: string;
  pdfID: string;
  poscicion: number;
}

interface SeccionPDFCreationAttributes
  extends Optional<SeccionPDFAttributes, "id"> {}

export class SeccionPDF
  extends Model<SeccionPDFAttributes, SeccionPDFCreationAttributes>
  implements SeccionPDFAttributes
{
  public id!: string;
  public pdfID!: string;
  public items?: ItemPDF[]; // <-- aquí

  public poscicion!: number;
}

SeccionPDF.init(
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

    poscicion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "SeccionPDF",
    tableName: "SeccionPDF",
    timestamps: false,
  }
);

export default SeccionPDF;
