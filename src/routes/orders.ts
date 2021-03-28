import { Cart, User,  } from ".prisma/client";
import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import { CartWithProduct } from "../types";
import prisma from "../utilities/db";
import {
  initiateCardPayment,
  validateCardPayment,
} from "../utilities/payments";
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

    if (payment_method === "CARD") {
      // get card info
      const { card_number, card_name, cvv, expiration_date, pin } = req.body;

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
      } else if (typeof pin !== "string" || !pin) {
        throw new Error("Invalid pin.");
      }

      // calculate the total
      const total = cartItems.reduce(
        (prev, item) => prev + item.quantity * item.product.price,
        0
      );

      // create a temp relation to keep track of payment
      const cardPayment = await prisma.cardPayment.create({
        data: {
          user_id: req.auth?.id as string,
          cart_items: JSON.stringify(cartItems),
          total: total,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: req.auth?.id },
      });

      const [expiry_month, expiry_year] = expiration_date.split("/");

      // process payment
      const cardDetails = {
        card_number,
        cvv,
        expiry_month,
        expiry_year,
        authorization: {
          mode: "pin",
          pin,
        },
      };

      const flwRef = await initiateCardPayment(
        total,
        String(cardPayment.id),
        cardDetails,
        user as User
      );

      res.send({
        data: { flw_ref: flwRef },
        error: true,
        message:
          "Successfully instantiated payment please reply with your otp.",
      });
    } else if (payment_method === "CASH") {
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
        message: "Successfully placed order",
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
  try {
    const { otp, flw_ref } = req.body;

    const [txRef] = await validateCardPayment(otp, flw_ref);

    const payment = await prisma.cardPayment.findUnique({
      where: {
        id: txRef,
      },
    });

    const cartItems = JSON.parse(payment?.cart_items as string) as Array<CartWithProduct>;

    await prisma.cardPayment.delete({
      where: {
        id: txRef,
      },
    });

    const {
      first_name,
      last_name,
      phone_number,
      address,
    } = req.body;

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
      message: "Successfully placed order",
      data: null,
    });
  } catch (error) {
    res.send({
      message: error.message,
      data: null,
      error: true,
    });
  }
});
/* Update orders mad */
router.put("/order", mandatoryAuth, async (req, res) => {});

export default router;
