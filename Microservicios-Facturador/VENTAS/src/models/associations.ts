import ItemsVenta from "./ItemsVenta";
import { Puc } from "./Puc"; // Asegúrate de que este modelo esté bien definido

//Un item de venta pertenece puc
ItemsVenta.belongsTo(Puc, {
  foreignKey: "idCategoria",
});

//Puc tiene muchos items de venta
Puc.hasMany(ItemsVenta, { foreignKey: "idCategoria" });
