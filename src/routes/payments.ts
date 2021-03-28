import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import { CreateDiscountBody, UpdateDiscountBody } from "../types";
import prisma from "../utilities/db";
const router = express.Router();

/* Get all user payments */
router.get("/user", mandatoryAuth, async (req, res) => {
  try {
    const user_id = req.auth?.id;

    const orders = await prisma.invoice.findMany({
      where: {
        order: {
          
        }
      }
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Get all vendor payments */
router.get("/vendor", mandatoryAuth, async (req, res) => {});

/* Update vendor invoice payment */
router.put("/invoice", mandatoryAuth, async (req, res) => {});

/* Get all pending vendor payments */
router.get("/vendor", mandatoryAuth, async (req, res) => {});

/* Update orders mad */
router.post("/discount", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid role to create deiscount.");
    }

    const {
      discount_code,
      discount_name,
      percent,
      ends,
    } = req.body as CreateDiscountBody;

    if (typeof discount_code !== "string" || !discount_code) {
      throw new Error("Invalid discount_code");
    } else if (typeof discount_name !== "string" || !discount_name) {
      throw new Error("Invalid discount_name");
    } else if (typeof percent !== "number" || !percent) {
      throw new Error("Invalid percent");
    } else if (typeof ends !== "string" || !ends) {
      throw new Error("Invalid end date.");
    }

    const discount = await prisma.discount.create({
      data: {
        discount_code,
        discount_name,
        ends,
        percent,
      },
    });

    res.send({
      error: false,
      message: "Successfully created discount",
      data: discount,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

router.get("/discount", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER" && req.auth?.role !== "ADMIN") {
      throw new Error("Invalid role to create deiscount.");
    }

    const discounts = await prisma.discount.findMany({});

    res.send({
      error: false,
      message: "Successfully created discount",
      data: discounts,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

router.put("/discount", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid role to update discount.");
    }

    const { ends, percent, discount_id } = req.body as UpdateDiscountBody;

    if (typeof percent !== "number" || !percent) {
      throw new Error("Invalid percent");
    } else if (typeof ends !== "string" || !ends) {
      throw new Error("Invalid end date.");
    }

    const discount = await prisma.discount.update({
      where: {
        id: discount_id,
      },
      data: {
        ends,
        percent,
      },
    });
  } catch (error) {}
});

export default router;
