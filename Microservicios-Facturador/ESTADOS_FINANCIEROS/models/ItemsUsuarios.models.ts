import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface ItemsUsuariosAttributes {
  id: string;
  usuarioID: number;
  itemID: number;
  peso: number;
  calificacionItem?: number;
  cumplimiento?: number;
}

interface ItemsUsuariosCreationAttributes
  extends Optional<ItemsUsuariosAttributes, "id"> {}

export class ItemsUsuarios
  extends Model<ItemsUsuariosAttributes, ItemsUsuariosCreationAttributes>
  implements ItemsUsuariosAttributes
{
  public id!: string;
  public usuarioID!: number;
  public itemID!: number;
  public peso!: number;
  public calificacionItem?: number;
  public cumplimiento?: number;
}

ItemsUsuarios.init(
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
    itemID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    peso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    calificacionItem: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cumplimiento: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ItemsUsuarios",
    tableName: "ItemsUsuarios",
    timestamps: false,
  }
);

export default ItemsUsuarios;
