import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import prisma from "../utilities/db";
const router = express.Router();

/* Get all orders made to a vendor */
router.post("/add", mandatoryAuth, async (req, res) => {
  try {
    const { product_id, quantity, type } = req.body;

    if (!product_id || !quantity) {
      throw new Error("Invalid product_id and quantity.");
    }

    const cart = await prisma.cart.create({
      data: {
        user_id: req.auth?.id as string,
        product_id,
        quantity,
        type
      },
    });

    res.send({
      error: false,
      message: "Successfully added item to card.",
      data: cart,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Get all orders made on the platform -- admin only */
router.get("/remove", mandatoryAuth, async (req, res) => {
  try {
    const { cart_id } = req.body;

    const cart = await prisma.cart.delete({
      where: {
        id: cart_id,
      },
    });

    res.send({
      error: true,
      message: "Successfully deleted item from cart.",
      data: cart,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Create all orders */
router.post("/update", mandatoryAuth, async (req, res) => {
  try {
    const { cart_id, quantity } = req.body;

    if (quantity === 0) {
      throw new Error(
        "You can't set quantity to 0 but you can remove item from cart."
      );
    }

    const cart = await prisma.cart.update({
      where: {
        id: cart_id,
      },
      data: {
        quantity,
      },
    });

    res.send({
      error: true,
      message: "Successfully update item in cart.",
      data: cart,
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
router.put("/clear", mandatoryAuth, async (req, res) => {
  try {
    const cart = await prisma.cart.deleteMany({
      where: {
        user_id: req.auth?.id,
      },
    });

    res.send({
      error: true,
      message: "Successfully deleted all items in cart.",
      data: cart,
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
