import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { importAll } from "../controllers/helper/importData";
import {
  getDescripciones,
  getItems,
  getSecciones,
} from "../controllers/helper/csv";

const router = Router();

router.get("/secciones", getSecciones);
router.get("/descripciones", getDescripciones);
router.get("/items", getItems);
// router.get("/import", asyncHandler(importAll));

export default router;
