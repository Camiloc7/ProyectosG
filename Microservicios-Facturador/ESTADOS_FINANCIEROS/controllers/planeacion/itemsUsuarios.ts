import { Request, Response } from "express";
import { MyJwtPayload } from "../../types/types";
import InfoExtraPDF from "../../models/InfoExtraPDF.models";
import ItemsUsuarios from "../../models/ItemsUsuarios.models";

export const createOrUpdate = async (req: Request, res: Response) => {
  try {
    const { itemId, peso, calificacionItem, cumplimiento } = req.body;
    const { id_empresa: usuarioId } = req.user as MyJwtPayload;

    // Validaciones básicas
    if (!usuarioId) {
      return res.status(401).json({
        status: false,
        message: "Usuario no autenticado.",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        status: false,
        message: "El campo 'itemId' es obligatorio.",
      });
    }

    // Buscar si ya existe un registro para este usuario y item
    let itemDeUsuario = await ItemsUsuarios.findOne({
      where: {
        usuarioID: usuarioId,
        itemID: itemId,
      },
    });

    if (itemDeUsuario) {
      // Actualizar los campos necesarios
      itemDeUsuario.peso = peso;
      itemDeUsuario.calificacionItem = calificacionItem;
      itemDeUsuario.cumplimiento = cumplimiento;

      await itemDeUsuario.save();

      return res.status(200).json({
        status: true,
        message: "Item de usuario actualizado exitosamente.",
        data: itemDeUsuario,
      });
    } else {
      // Crear un nuevo registro
      const nuevoItem = await ItemsUsuarios.create({
        usuarioID: usuarioId,
        itemID: itemId,
        peso,
        calificacionItem,
        cumplimiento,
      });

      return res.status(201).json({
        status: true,
        message: "Item de usuario creado exitosamente.",
        data: nuevoItem,
      });
    }
  } catch (error) {
    console.error("Error en createOrUpdate:", error);
    return res.status(500).json({
      status: false,
      message:
        error instanceof Error ? error.message : "Error interno desconocido.",
    });
  }
};
