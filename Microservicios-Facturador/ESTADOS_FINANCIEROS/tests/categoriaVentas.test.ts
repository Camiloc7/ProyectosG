// import { Request, Response } from "express";
// import {
//   getCategoriasProducto,
//   getCategoriasEmpresa,
// } from "../controllers/ventas/categorias";
// import { Puc } from "../models/Puc";
// import { sequelize } from "../config/database"; // Importamos la conexión a la BD

// jest.mock("../models/Puc"); // Mockeamos el modelo Puc para evitar consultas reales

// const mockResponse = () => {
//   const res: Partial<Response> = {};
//   res.json = jest.fn().mockReturnValue(res);
//   res.status = jest.fn().mockReturnValue(res);
//   return res as Response;
// };

// describe("Controladores de Categorías", () => {
//   afterAll(async () => {
//     await sequelize.close(); // Cierra la conexión después de los tests
//   });

//   describe("getCategoriasProducto", () => {
//     it("debería responder con éxito y retornar las categorías correspondientes", async () => {
//       const fakeCategorias = [
//         { Nombre: "Categoría A", TIPO: "INGRESO", Clave: "4130123" },
//         { Nombre: "Categoría B", TIPO: "INGRESO", Clave: "4130456" },
//       ];
//       (Puc.findAll as jest.Mock).mockResolvedValue(fakeCategorias);

//       const req = {} as Request;
//       const res = mockResponse();

//       await getCategoriasProducto(req, res);

//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         message: "Categorías obtenidas",
//         data: fakeCategorias.map((categoria) => ({
//           nombre: categoria.Nombre,
//           id: categoria.Clave,
//         })),
//       });
//     });

//     it("debería manejar errores y retornar status 500", async () => {
//       (Puc.findAll as jest.Mock).mockRejectedValue(new Error("Error simulado"));

//       const req = {} as Request;
//       const res = mockResponse();

//       await getCategoriasProducto(req, res);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Error interno",
//       });
//     });
//   });

//   describe("getCategoriasEmpresa", () => {
//     it("debería responder con éxito y retornar las categorías transformadas", async () => {
//       const fakeCategorias = [
//         { Nombre: "Categoría X", TIPO: "INGRESO", Clave: 5000 },
//         { Nombre: "Categoría Y", TIPO: "INGRESO", Clave: 8000 },
//       ];
//       (Puc.findAll as jest.Mock).mockResolvedValue(fakeCategorias);

//       const req = {} as Request;
//       const res = mockResponse();

//       await getCategoriasEmpresa(req, res);

//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         message: "Categorías obtenidas",
//         data: fakeCategorias.map((categoria) => ({
//           nombre: categoria.Nombre,
//           id: categoria.Clave,
//         })),
//       });
//     });

//     it("debería manejar errores y retornar status 500", async () => {
//       (Puc.findAll as jest.Mock).mockRejectedValue(new Error("Error simulado"));

//       const req = {} as Request;
//       const res = mockResponse();

//       await getCategoriasEmpresa(req, res);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Error interno",
//       });

//     });
//   });
// });
