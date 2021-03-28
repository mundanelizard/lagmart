import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import prisma from "../utilities/db";
const router = express.Router();

/* Get all orders made to a vendor */
router.get("/add", mandatoryAuth, async (req, res) => { });

/* Get all orders made on the platform -- admin only */
router.get("/remove", mandatoryAuth, async (req, res) => { });

/* Create all orders */
router.post("/update", mandatoryAuth, async (req, res) => { });

/* Update orders mad */
router.put("/clean", mandatoryAuth, async (req, res) => { });

export default router;
