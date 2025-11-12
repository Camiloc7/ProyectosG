"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = void 0;
const validateContentType = (req, res, next) => {
    const allowed = ["application/json", "multipart/form-data"];
    const contentType = req.headers["content-type"] || "";
    if (!allowed.some((type) => contentType.includes(type))) {
        res.status(415).json({ message: "Tipo de contenido no permitido" });
        return;
    }
    next();
};
exports.validateContentType = validateContentType;
