import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { INTEGER } from "sequelize";

export interface ItemsAttributes {
  id: number;
  descripcionID:  number;
  valorItemEstandar: number;
  actividad: String;
  codigo: String;
}

interface ItemsCreationAttributes extends Optional<ItemsAttributes, "id"> {}

export class Items
  extends Model<ItemsAttributes, ItemsCreationAttributes>
  implements ItemsAttributes
{
  public id!: number;
  public descripcionID!: number;
  public valorItemEstandar!: number;
  public actividad!: String;
  public codigo!: String;
}
//Columna D del Exel
Items.init(
  {
    id: {
      type: INTEGER,
      primaryKey: true,
    },
    descripcionID: {
      //Aqui va el id de la descripcion a la que corresponde
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valorItemEstandar: {
      //Columna E del Exel
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actividad: {
      //El texto del item del estanda columna D Ej.(Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST)
      type: DataTypes.STRING,
      allowNull: false,
    },
    codigo: {
      //los numeros de la columna D  ejemplo:(1.1.1)
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Items",
    tableName: "Items",
    timestamps: true,
  }
);

export default Items;
