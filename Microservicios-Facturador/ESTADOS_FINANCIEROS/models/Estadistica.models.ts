//!EN ESTADISTICAS NUNCA SE HACE UPDATE SOLAMENTE INSERT (POST)

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface EstadisticaAttributes {
  id: string;
  itemID: number;
  fecha: Date;
  calificacionCiclo: number;
  cumplimientoGeneral: number;
  tareasPendientes: number;
  ActividadesEnProgreso: number;
  ActividadesFinalizadas: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EstadisticaCreationAttributes
  extends Optional<EstadisticaAttributes, "id"> {}

export class Estadistica
  extends Model<EstadisticaAttributes, EstadisticaCreationAttributes>
  implements EstadisticaAttributes
{
  public id!: string;
  public itemID!: number;
  public fecha!: Date;
  public calificacionCiclo!: number;
  public cumplimientoGeneral!: number;
  public tareasPendientes!: number;
  public ActividadesEnProgreso!: number;
  public ActividadesFinalizadas!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Estadistica.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    calificacionCiclo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cumplimientoGeneral: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tareasPendientes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ActividadesEnProgreso: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ActividadesFinalizadas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Estadistica",
    tableName: "Estadistica",
    timestamps: true,
  }
);

export default Estadistica;
