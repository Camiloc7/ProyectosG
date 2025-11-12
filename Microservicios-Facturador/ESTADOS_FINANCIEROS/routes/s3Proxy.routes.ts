import { Router, Request, Response } from "express";
import { Readable } from "stream";
import { asyncHandler } from "../utils/asyncHandler";
import { getProxyImage } from "../controllers/proxy/proxy";

const router = Router();

router.post("/proxy", asyncHandler(getProxyImage));

export default router;
