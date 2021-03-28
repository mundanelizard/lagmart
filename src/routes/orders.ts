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
router.post("/order", mandatoryAuth, async (req, res) => {
  try {
    const {
      payment_id,
      payment_method,
      first_name,
      last_name,
      phone_number,
      address,
    } = req.body;

    // get all items in cart
    const cartItems = await prisma.cart.findMany({
      where: { user_id: req.auth?.id },
      include: {
        product: true,
      },
    });

    // create an order groun
    const orderGroup = await prisma.orderGroup.create({
      data: {
        address,
        first_name,
        last_name,
        phone_number,
        user_id: req.auth?.id as string,
      },
    });

    if (payment_method === "CARD") {
      // get card info
      const { card_number, card_name, cvv, expiration_date } = req.body;

      if (typeof card_number !== "string" || !card_number) {
        throw new Error("Invalid card number.");
      } else if (typeof card_name !== "string" || !card_name) {
        throw new Error("Invalid card name");
      } else if (typeof cvv !== "string") {
        throw new Error("Invalid cvv.");
      } else if (
        typeof expiration_date !== "string" ||
        expiration_date.split("/").length !== 2
      ) {
        throw new Error("Invalid expiration date.");
      }

      // calculate the total
      const total = cartItems.reduce(
        (prev, item) => prev + item.quantity * item.product.price,
        0
      );

      // process payment

      // authorization: {
      //   mode: "pin",
      //   pin
      // }

      // create a temp relation to keep track of payment
      await prisma.cardPayment.create({
        data: {
          user_id: req.auth?.id as string,
          cart_items: JSON.stringify(cartItems),
          total: total,
        },
      });
    } else if (payment_method === "CASH") {
      // create an orders for cart items and link their invoice.
      const orderPromises = cartItems.map((item) =>
        prisma.order.create({
          data: {
            order_group_id: orderGroup.id,
            product_id: item.product.id,
            quantity: item.quantity,
            status: "PENDING",
            Invoice: {
              create: {
                amount: item.quantity * item.product.price,
                payment_method: "CASH",
                payment_status: "NOT_PAID",
              },
            },
          },
        })
      );

      // update product stock quantities
      const productPromises = cartItems.map((item) =>
        prisma.product.update({
          where: {
            id: item.product.id,
          },
          data: {
            stock:
              item.product.stock - item.quantity >= 0
                ? item.product.stock - item.quantity
                : 0,
          },
        })
      );

      // Creates order and updates invoice.
      await Promise.all([...productPromises, ...orderPromises] as Array<
        Promise<any>
      >);

      // Deletes user cart.
      await prisma.cart.deleteMany({
        where: {
          user_id: req.auth?.id,
        },
      });

      res.send({
        error: false,
        message: "Successfully created order",
        data: null,
      });
    }
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});


router.post("/verify", mandatoryAuth, async (req, res) => {
  const { otp, card_payment_id } = req.body;

})
/* Update orders mad */
router.put("/order", mandatoryAuth, async (req, res) => {});

export default router;
