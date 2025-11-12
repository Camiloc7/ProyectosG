import { Request, Response } from "express";
import { Readable } from "stream";

export const getProxyImage = async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(200).json({
      status: false,
      message: "No llego el url.",
    });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(200).json({
        status: false,
        message: "No se pudo recibir respuesta del bucket.",
      });
    }

    if (!response.body) {
      return res.status(200).json({
        status: false,
        message: "Body vacio",
      });
    }

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream"
    );

    const nodeReadable = Readable.fromWeb(response.body as any); // Conversión necesaria
    nodeReadable.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(200).send("Proxy error");
  }
};
