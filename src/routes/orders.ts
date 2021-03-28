import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import prisma from "../utilities/db";
const router = express.Router();

/* Get all orders made by user */
router.get("/all", mandatoryAuth, async (req, res) => {});

/* Get all orders made to a vendor */
router.get("/vendor", mandatoryAuth, async (req, res) => {});

/* Get all orders made on the platform -- admin only */
router.get("/orders", mandatoryAuth, async (req, res) => {});

/* Create all orders */
router.post("/orders", mandatoryAuth, async (req, res) => {});

/* Update orders mad */
router.put("/order", mandatoryAuth, async (req, res) => {});

export default router;
