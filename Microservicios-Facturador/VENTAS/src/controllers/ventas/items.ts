import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { ItemsVenta } from "../../models/ItemsVenta";
import { Op } from "sequelize";
import { MyJwtPayload } from "../../types/types";
import { Puc } from "../../models/Puc"; // Asegúrate de que este modelo esté bien definido
import { validate as isUUID } from "uuid";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Función para eliminar imagen de S3 (si existe la imagen anterior)
const deleteImageFromS3 = async (imageKey: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: imageKey,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error al eliminar la imagen de S3:", error);
  }
};

// Tamaño máximo permitido para las imágenes (por ejemplo, 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Controlador para crear un nuevo item en la venta
export const postItemDeVenta = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validación con express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: false,
      errors: errors.array(),
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Usuario no autenticado",
    });
    return;
  }

  const userInfo = req.user as MyJwtPayload;
  const {
    idCategoria,
    descripcion,
    subtotal,
    unidadDeMedida,
    cantidad,
    porcentajeIva,
    iva,
    total,
    retefuente,
    reteica,
    descuentoVenta,
    valorFinalConRetenciones,
  } = req.body;

  // Validación de campos críticos
  if (!idCategoria) {
    console.log("Falta idCategoria");
    res.status(400).json({
      status: false,
      message: "La categoría es necesaria",
    });
    return;
  }

  try {
    // Verificamos que la categoría exista en la base de datos.
    const categoriaProducto = await Puc.findByPk(idCategoria);
    if (!categoriaProducto) {
      res.status(400).json({
        status: false,
        message: "Categoría inválida.",
      });
      return;
    }

    const anteriorItem = await ItemsVenta.findOne({
      where: {
        idUsuario: userInfo.id_empresa, // Filtrar por empresa/usuario
        codigo: {
          [Op.like]: `${categoriaProducto.Clave}%`,
        },
      },
      order: [["codigo", "DESC"]],
    });

    let codigo: number;
    if (anteriorItem) {
      codigo = anteriorItem.codigo + 1;
    } else {
      codigo = parseInt(`${categoriaProducto.Clave}001`, 10);
    }

    // Manejo de la imagen:
    let imageKey: string | null = null;
    if (req.file) {
      // console.log("Archivo recibido:", req.file);

      const file = req.file;
      // Validar que sea una imagen
      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({
          status: false,
          message: "El archivo subido no es una imagen válida",
        });
        return;
      }

      // Validar el tamaño del archivo
      if (file.size > MAX_FILE_SIZE) {
        res.status(400).json({
          status: false,
          message: "El archivo excede el tamaño máximo permitido",
        });
        return;
      }

      // Generar una key única utilizando UUID
      imageKey = `facturador/uploads/${uuidv4()}_${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: imageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await s3Client.send(command);
    } else {
      console.log("No se recibió archivo en req.file");
    }

    // Crear el ítem en la base de datos y guardar la key de la imagen.
    const itemCreado = await ItemsVenta.create({
      idUsuario: userInfo.id_empresa,
      codigo,
      cantidad,
      descripcion,
      subtotal,
      unidadDeMedida,
      porcentajeIva,
      iva,
      total,
      retefuente,
      reteica,
      urlImagen: imageKey,
      descuentoVenta,
      idCategoria,
      valorFinalConRetenciones,
    });

    res.status(200).json({
      status: true,
      message: "Item creado exitosamente",
      data: itemCreado,
    });
  } catch (error) {
    console.error("Error al crear el item:", error);
    res.status(500).json({
      status: false,
      message: "Error interno del servidor",
    });
  }
};

// Controlador para editar un ítem existente
export const putEditItemDeVenta = async (req: Request, res: Response) => {
  // Validación con express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: false,
      errors: errors.array(),
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Usuario no autenticado",
    });
    return;
  }

  const userInfo = req.user as MyJwtPayload;
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      status: false,
      message: "ID inválido o faltante",
    });
    return;
  }

  try {
    // Buscamos el ítem y verificamos que pertenezca al usuario/empresa autenticado.
    const item = await ItemsVenta.findOne({
      where: {
        id: id,
        idUsuario: userInfo.id_empresa,
      },
    });

    if (!item) {
      res.status(404).json({
        status: false,
        message: "Item no encontrado",
      });
      return;
    }

    // Validación: Verificamos que se haya enviado información para actualizar
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        status: false,
        message: "Información para actualizar no recibida",
      });
      return;
    }

    // Preparar un objeto con los campos permitidos (whitelisting)
    const allowedFields = [
      "descripcion",
      "subtotal",
      "unidadDeMedida",
      "cantidad",
      "porcentajeIva",
      "iva",
      "total",
      "retefuente",
      "reteica",
      "descuentoVenta",
      "valorFinalConRetenciones",
      // Puedes incluir otros campos permitidos, pero evita idUsuario, codigo, etc.
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    // Si se recibe un nuevo archivo (imagen), se procesa la actualización
    if (req.file) {
      // console.log("Nuevo archivo recibido:", req.file);

      // Validar que el archivo es de tipo imagen
      if (!req.file.mimetype.startsWith("image/")) {
        res.status(400).json({
          status: false,
          message: "El archivo subido no es una imagen válida",
        });
        return;
      }
      // Validar tamaño del archivo
      if (req.file.size > MAX_FILE_SIZE) {
        res.status(400).json({
          status: false,
          message: "El archivo excede el tamaño máximo permitido",
        });
        return;
      }

      // Si el ítem ya tenía una imagen, la eliminamos de S3 para evitar archivos huérfanos
      if (item.urlImagen) {
        await deleteImageFromS3(item.urlImagen);
      }

      // Generar key única para la nueva imagen usando UUID
      const imageKey = `facturador/uploads/${uuidv4()}_${
        req.file.originalname
      }`;
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3Client.send(command);
      updateData["urlImagen"] = imageKey;
    } else {
      console.log(
        "No se recibió imagen, se omite la actualización de urlImagen"
      );
    }

    // Actualizar el ítem utilizando los campos autorizados
    const updatedItem = await item.update(updateData);

    res.status(200).json({
      status: true,
      message: "Item actualizado exitosamente",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error al actualizar el item:", error);
    res.status(500).json({
      status: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Elimina un item por su id.
 */
export const deleteItemDeVenta = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Usuario no autenticado",
    });
    return;
  }

  const userInfo = req.user as MyJwtPayload;
  const { id } = req.params;

  if (!id || !isUUID(id)) {
    console.log("ID inválido o no está en formato UUID");
    res.status(400).json({
      status: false,
      message: "ID inválido",
    });
    return;
  }

  try {
    // Buscar el ítem y asegurarnos de que pertenece a la empresa del usuario autenticado
    const item = await ItemsVenta.findOne({
      where: {
        id: id,
        idUsuario: userInfo.id_empresa,
      },
    });

    if (!item) {
      res.status(404).json({
        status: false,
        message: "Item no encontrado",
      });
      return;
    }

    // Si el ítem tiene imagen asociada, intentar eliminarla de S3
    if (item.urlImagen) {
      await deleteImageFromS3(item.urlImagen);
    }

    // Eliminar el ítem de la base de datos
    await item.destroy();

    res.status(200).json({
      status: true,
      message: "Item eliminado exitosamente",
    });
    return;
  } catch (error) {
    console.error("Error al eliminar el item:", error);
    res.status(500).json({
      status: false,
      message: "Error interno del servidor",
    });
    return;
  }
};

export const getItemById = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Usuario no autenticado",
    });
    return;
  }

  const userInfo = req.user as MyJwtPayload;
  const { id } = req.params;

  // Validación de formato del ID (por ejemplo, UUID o numérico)
  if (!id) {
    res.status(400).json({
      status: false,
      message: "ID inválido o faltante",
    });
    return;
  }

  try {
    const item = await ItemsVenta.findOne({
      where: {
        id,
        idUsuario: userInfo.id_empresa,
      },
    });

    if (!item) {
      res.status(404).json({
        status: false,
        message: "Item no encontrado",
      });
      return;
    }

    // Generar URL prefirmada si hay imagen
    if (item.urlImagen) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: item.urlImagen,
        });
        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 28800, // 8 horas
        });
        item.urlImagen = presignedUrl;
      } catch (error) {
        console.error(
          `Fallo generando URL prefirmada para key ${item.urlImagen}`,
          error
        );
        item.urlImagen = ""; // Mejor que una string ambigua
      }
    }

    const parseItemNumerics = (itemData: any) => {
      const numericFields = [
        "subtotal",
        "iva",
        "total",
        "retefuente",
        "reteica",
        "descuentoVenta",
      ];
      const parsed = { ...itemData.toJSON() };

      numericFields.forEach((key) => {
        const val = parseFloat(parsed[key]);
        parsed[key] = isNaN(val) ? 0 : val;
      });

      return parsed;
    };

    res.json({
      status: true,
      message: "Información del item obtenida",
      data: parseItemNumerics(item),
    });
    return;
  } catch (error) {
    console.error("Error inesperado al obtener el item", error);
    res.status(500).json({
      status: false,
      message: "Error interno del servidor",
    });
    return;
  }
};

/**
 * Obtiene una lista de items con algunos campos específicos, filtrados por el id de la empresa del usuario.
 */
export const getItemsListByEmpresa = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Usuario no autenticado",
    });
    return;
  }

  const userInfo = req.user as MyJwtPayload;

  if (!userInfo.id_empresa) {
    res.status(400).json({
      status: false,
      message: "No se pudo determinar el usuario",
    });
    return;
  }

  try {
    const items = await ItemsVenta.findAll({
      // logging: console.log, // <— así verás el SQL generado

      where: {
        idUsuario: userInfo.id_empresa,
      },
      // attributes: [
      //   "id",
      //   "codigo",
      //   "descripcion",
      //   "total",
      //   "cantidad",
      //   "idCategoria",
      //   "urlImagen",
      //   "iva",
      //   "iva",
      // ],
    });
    // Procesamos cada item para generar su URL prefirmada
    const itemsWithSignedUrls = await Promise.all(
      items.map(async (item) => {
        const itemData = item.toJSON();

        if (itemData.urlImagen) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.BUCKET_NAME,
              Key: itemData.urlImagen,
            });
            const presignedUrl = await getSignedUrl(s3Client, command, {
              expiresIn: 28800, // 8 horas
            });
            itemData.urlImagen = presignedUrl;
          } catch (error) {
            console.error(
              `Error generando URL prefirmada para la key ${itemData.urlImagen}:`,
              error
            );
            itemData.urlImagen = null;
          }
        }

        return itemData;
      })
    );

    res.status(200).json({
      status: true,
      message: "Lista de items obtenida",
      data: itemsWithSignedUrls,
    });
  } catch (error) {
    console.error("Error al obtener la lista de items:", error);
    res.status(500).json({
      status: false,
      message: "Error interno del servidor",
    });
  }
};

export const getProximoCodigo = async (req: Request, res: Response) => {
  // 1️⃣ Usuario autenticado
  if (!req.user) {
    res.status(401).json({ status: false, message: "Usuario no autenticado" });
    return;
  }

  const { id_empresa: idUsuario } = req.user as MyJwtPayload;
  const { idCategoriaProducto } = req.params;

  // 2️⃣ Parámetro válido
  if (!idCategoriaProducto) {
    res.status(400).json({ status: false, message: "Faltan datos" });
    return;
  }

  try {
    // 3️⃣ La categoría existe?
    const categoria = await Puc.findByPk(idCategoriaProducto);
    if (!categoria) {
      console.log("La categoria no existe en el puc");
      res.status(400).json({ status: false, message: "Categoría inválida." });
      return;
    }

    const prefix = categoria.Clave.toString();
    const SUFFIX_LENGTH = 3; // 001, 002, …

    // 4️⃣ Buscamos último código de este usuario + categoría
    const lastItem = await ItemsVenta.findOne({
      where: {
        idUsuario,
        codigo: { [Op.like]: `${prefix}%` },
      },
      order: [["codigo", "DESC"]],
    });

    // 5️⃣ Calculamos el siguiente código
    let nextCodigo: number;
    if (lastItem) {
      const lastStr = lastItem.codigo.toString();
      const lastSuffix = lastStr.slice(prefix.length);
      const nextNum = parseInt(lastSuffix, 10) + 1;
      const padded = nextNum.toString().padStart(SUFFIX_LENGTH, "0");
      nextCodigo = parseInt(prefix + padded, 10);
    } else {
      const padded = "1".padStart(SUFFIX_LENGTH, "0");
      nextCodigo = parseInt(prefix + padded, 10);
    }

    // 6️⃣ Devolvemos resultado
    res.status(200).json({
      status: true,
      message: "El siguiente código será:",
      data: nextCodigo,
    });
    return;
  } catch (error) {
    console.error("Error al generar el próximo código:", error);
    res
      .status(500)
      .json({ status: false, message: "Error interno del servidor" });
    return;
  }
};
