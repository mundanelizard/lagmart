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
        order: {},
      },
    });
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

/* Pending payments for all  */
router.get("/pending", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER") {
      throw new Error("Only super access this route.");
    }

    res.send({
      message: "Successfully retrieved pending.",
      error: false,
      data: await prisma.invoice.findMany({
        where: {
          vendor_payment_status: "NOT_PAID",
        },
        include: {
          order: {
            include: {
              product: true,
            },
          },
        },
      }),
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Fufilled payments for all */
router.get("/fufilled", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER") {
      throw new Error("Only super access this route.");
    }

    res.send({
      message: "Successfully retrieved pending.",
      error: false,
      data: await prisma.invoice.findMany({
        where: {
          vendor_payment_status: "PAID",
        },
        include: {
          order: {
            include: {
              product: true,
            },
          },
        },
      }),
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Get all pending vendor payments */
router.get("/vendor/pending", mandatoryAuth, async (req, res) => {
  try {
    res.send({
      error: true,
      message: "Successfully updated vendor.",
      data: await prisma.invoice.findMany({
        where: {
          vendor_payment_status: "PAID",
          order: {
            product: {
              user_id: req.auth?.id,
            },
          },
        },
        include: {
          order: {
            include: {
              product: true,
            },
          },
        },
      }),
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Get all fufilled vendor payments */
router.get("/vendor/fufilled", mandatoryAuth, async (req, res) => {
  try {
    res.send({
      error: true,
      message: "Successfully updated vendor.",
      data: await prisma.invoice.findMany({
        where: {
          vendor_payment_status: "NOT_PAID",
          order: {
            product: {
              user_id: req.auth?.id,
            },
          },
        },
        include: {
          order: {
            include: {
              product: true,
            },
          },
        },
      }),
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

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
    } else if (percent < 0 || percent > 100) {
      throw new Error("Invalid percent.");
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

/* Get all discounts */
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

/* Get discount by code */
router.get("/discount/:code", mandatoryAuth, async (req, res) => {
  try {
    res.send({
      error: false,
      message: "Successfully retrieved discount.",
      data: await prisma.discount.findFirst({
        where: {
          discount_code: req.params.discount_code,
          redeemer: {
            none: {
              user_id: req.auth?.id,
            },
          },
        },
      }),
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Update Discount */
router.put("/discount", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid role to update discount.");
    }

    const { ends, percent, discount_id } = req.body as UpdateDiscountBody;

    if (typeof percent !== "number" || !percent) {
      throw new Error("Invalid percent.");
    } else if (typeof ends !== "string" || !ends) {
      throw new Error("Invalid end date.");
    } else if (percent < 0 || percent > 100) {
      throw new Error("Invalid percent.");
    }

    await prisma.discount.update({
      where: {
        id: discount_id,
      },
      data: {
        ends,
        percent,
      },
    });

    res.send({
      error: true,
      message: "Successfully updated message",
      data: null,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

export default router;
