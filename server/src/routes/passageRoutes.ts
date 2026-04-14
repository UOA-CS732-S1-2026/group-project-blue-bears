import { Router } from "express";
import { getRandomPassage } from "../controllers/passageController";

const router = Router();

router.get("/", getRandomPassage);

export default router;