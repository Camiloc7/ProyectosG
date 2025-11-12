import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TableDataAttributes {
  id: string;
  itemPdfId: string;
  headers: string[];
  rows: string[][];
}

interface TableDataCreationAttributes
  extends Optional<TableDataAttributes, "id"> {}

export class TableData
  extends Model<TableDataAttributes, TableDataCreationAttributes>
  implements TableDataAttributes
{
  public id!: string;
  public itemPdfId!: string;
  public headers!: string[];
  public rows!: string[][];
}

TableData.init(
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
    // models/TableData.ts
    rows: {
      type: DataTypes.JSON, // sigue usándose JSON en el modelo
      allowNull: false,
      get() {
        const raw = this.getDataValue("rows");
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        }
        return Array.isArray(raw) ? raw : [];
      },
      set(val: string[][]) {
        this.setDataValue("rows", val);
      },
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const raw = this.getDataValue("headers");
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        }
        return Array.isArray(raw) ? raw : [];
      },
      set(val: string[]) {
        this.setDataValue("headers", val);
      },
    },
  },
  {
    sequelize,
    modelName: "TableData",
    tableName: "TableData",
    timestamps: false,
  }
);

export default TableData;
