import { Request, Response } from "express";
import { Op, where } from "sequelize";
import { Puc } from "../../models/Puc"; // Asegúrate de que este modelo esté bien definido

import axios from "axios";

export const getCategoriasProductoSegunCiuu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = res.locals.token;

    // 1. Petición al endpoint externo
    const response = await axios.get(
      "https://facturador.qualitysoftservices.com/index.php/api/usuarios/obtenerUsuario",
      {
        headers: { authorization: `Bearer ${token}` },
      }
    );
    const usuario = response.data?.[0];
    const rawCiiu = usuario?.CIIU;
    if (!rawCiiu) {
      throw new Error("No se encontró el CIIU");
    }

    // 2. Separar y validar cada código
    const ciiuList = rawCiiu
      .split(",") // ["4125", "4130", ...]
      .map((c: string) => c.trim())
      .filter((c: string) => {
        if (!/^[a-zA-Z0-9]+$/.test(c)) {
          console.warn(`Código CIIU inválido descartado: ${c}`);
          return false;
        }
        return true;
      });

    if (ciiuList.length === 0) {
      throw new Error("No hay códigos CIIU válidos tras la validación.");
    }

    // 3. Construir cláusula WHERE con Op.or + LIKE
    const whereClause = {
      [Op.or]: ciiuList.map((code: string) => ({
        Clave: { [Op.like]: `${code}__` },
      })),
    };

    // 4. Consultar todas las categorías que coincidan con cualquiera de los códigos
    const categorias = await Puc.findAll({ where: whereClause });

    // Transformar resultado
    const categoriasTransformadas = categorias.map((categoria) => ({
      nombre: categoria.Nombre,
      id: categoria.Codigo,
    }));

    // 5. Responder con todos los resultados
    res.json({
      status: true,
      message: "Categorías obtenidas",
      data: categoriasTransformadas,
      ciiu: ciiuList,
    });
  } catch (error: any) {
    console.error("Error al obtener el CIIU o las categorías:", error);
    res
      .status(500)
      .json({ status: false, message: error.message || "Error interno" });
  }
};

export const getCategoriasEmpresa = async (req: Request, res: Response) => {
  try {
    // Obtener datos usando Sequelize
    const categorias = await Puc.findAll({
      where: {
        Clave: {
          [Op.like]: `41__`,
        },
      },
    });

    const categoriasTransformadas = categorias.map((categoria) => ({
      nombre: categoria.Nombre,
      clave: categoria.Clave,
      codigo: categoria.Codigo,
    }));

    res.json({
      status: true,
      message: "Categorías obtenidas",
      data: categoriasTransformadas,
    });
  } catch (error) {
    console.error("Error obteniendo las categorías:", error);
    res.status(500).json({ status: false, message: "Error interno" });
  }
};

export const getCategoriaName = async (req: Request, res: Response) => {
  try {
    const { ciiu } = req.body;
    if (!ciiu) {
      res.json({
        status: false,
        message: "Datos faltantes.",
      });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(ciiu)) {
      throw new Error("CIIU inválido.");
    }

    const categorias = await Puc.findAll({
      where: {
        Clave: {
          [Op.like]: ciiu,
        },
      },
    });

    const nombre = { nombre: categorias[0]?.Nombre };

    res.json({
      status: true,
      message: "Nombre de ciiu encontrado.",
      data: categorias,
    });
  } catch (error) {
    console.error("Error obteniendo las categorías:", error);
    res.status(500).json({ status: false, message: "Error interno" });
  }
};

export const getCategoriaSelect = async (req: Request, res: Response) => {
  try {
    // Obtener datos usando Sequelize con expresión regular
    const categorias = await Puc.findAll({
      where: {
        Clave: {
          [Op.regexp]: "^[0-9]{2,8}$", // de 2 a 8 dígitos de cualquier valor
        },
      },
    });

    const categoriasTransformadas = categorias.map((categoria) => ({
      nombre: categoria.Nombre,
      clave: categoria.Clave,
      codigo: categoria.Codigo,
    }));

    res.json({
      status: true,
      message: "Categorías obtenidas",
      data: categoriasTransformadas,
    });
  } catch (error) {
    console.error("Error obteniendo las categorías:", error);
    res.status(500).json({ status: false, message: "Error interno" });
  }
};
