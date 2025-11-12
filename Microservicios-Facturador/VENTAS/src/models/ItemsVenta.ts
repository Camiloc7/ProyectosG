import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class ItemsVenta extends Model {
  public id!: string;
  public codigo!: number;
  public idUsuario!: number;
  public descripcion!: string;
  public subtotal!: number;
  public unidadDeMedida!: number;
  public porcentajeIva!: number;
  public iva!: number;
  public total!: number;
  public retefuente!: number;
  public reteica!: number;
  public urlImagen!: string;
  public descuentoVenta!: number;
  public idCategoria!: number;
  public valorFinalConRetenciones!: number;
}

ItemsVenta.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "ItemsVentas_idUsuario_codigo_unique",
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "ItemsVentas_idUsuario_codigo_unique",
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unidadDeMedida: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    porcentajeIva: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    iva: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    retefuente: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    reteica: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    urlImagen: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    descuentoVenta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    idCategoria: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valorFinalConRetenciones: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ItemsVenta",
    tableName: "ItemsVentas",
    timestamps: true,
  }
);

export default ItemsVenta;
