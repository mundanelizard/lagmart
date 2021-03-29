import { Cart, User } from ".prisma/client";
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
router.get("/all", mandatoryAuth, async (req, res) => {
  try {
    const orders = await prisma.orderGroup.findMany({
      include: {
        orders: {
          include: {
            product: true,
            order_group: true,
            invoice: true,
          },
        },
      },
    });

    res.send({
      error: false,
      message: "Successfully fetched orders.",
      data: orders,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Get all orders made to a vendor */
router.get("/vendor", mandatoryAuth, async (req, res) => {
  try {
    const orders = await prisma.product.findMany({
      where: {
        user_id: req.auth?.id as string,
      },
      include: {
        order: {
          include: {
            order_group: true,
            invoice: true,
            product: true,
          },
        },
      },
    });

    res.send({
      error: false,
      message: "Successfully fetched orders.",
      data: orders,
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
router.get("/orders", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role !== "SUPER" && req.auth?.role !== "ADMIN") {
      throw new Error("You have invalid access level.");
    }

    const orders = await prisma.orderGroup.findMany({
      include: {
        orders: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully fetched orders.",
      data: orders,
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
router.post("/order", mandatoryAuth, async (req, res) => {
  try {
    const {
      payment_method,
      first_name,
      last_name,
      phone_number,
      address,
      discount_code,
    } = req.body;

    // get all items in cart
    const cartItems = await prisma.cart.findMany({
      where: { user_id: req.auth?.id },
      include: {
        product: true,
      },
    });

    const discountDetails = await prisma.discount.findFirst({
      where: {
        discount_code,
      },
    });

    if (
      discountDetails &&
      Date.now() < new Date(discountDetails.ends).getTime()
    ) {
      // check if user has redeemed
      const redeemed = await prisma.redeem.findFirst({
        where: {
          user_id: req.auth?.id,
        },
        include: {
          discount: true,
        },
      });

      if (redeemed) {
        var discount = 1;
      } else {
        var discount = (discountDetails.percent as number) / 100;

        await prisma.redeem.create({
          data: {
            discount_id: discountDetails.id,
            user_id: req.auth?.id as string,
          },
        });
      }
    } else {
      var discount = 1;
    }

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
          total: total * discount,
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
            invoice: {
              create: {
                amount: item.quantity * item.product.price * discount,
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
    const { otp, flw_ref, discount_code } = req.body;

    const [txRef] = await validateCardPayment(otp, flw_ref);

    const payment = await prisma.cardPayment.findUnique({
      where: {
        id: txRef,
      },
    });

    const discountDetails = await prisma.discount.findFirst({
      where: {
        discount_code,
      },
    });

    if (discountDetails) {
      var discount = discountDetails.percent / 100
    } else {
      var discount = 1;
    }

    const cartItems = JSON.parse(
      payment?.cart_items as string
    ) as Array<CartWithProduct>;

    await prisma.cardPayment.delete({
      where: {
        id: txRef,
      },
    });

    const { first_name, last_name, phone_number, address } = req.body;

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
          invoice: {
            create: {
              amount: (item.quantity * item.product.price) * discount,
              payment_method: "CARD",
              payment_status: "PAID",
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
router.put("/order", mandatoryAuth, async (req, res) => {
  try {
    const { order_id, status } = req.body;

    const order = await prisma.order.findUnique({
      where: {
        id: order_id,
      },
      include: {
        product: true,
        invoice: true,
      },
    });

    if (order?.product.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw Error(
        "You don't have the right role or permission to update order status."
      );
    }

    if (status === "FUFILLED") {
      await prisma.order.update({
        where: {
          id: order_id,
        },
        data: {
          status,
          invoice: {
            update: {
              payment_status: "PAID",
            },
          },
        },
      });
    } else if (status === "CANCELLED") {
      await prisma.order.update({
        where: {
          id: order_id,
        },
        data: {
          status,
        },
      });
    }

    // if user doesn't check if he is super
    // update order if previous contraints were passed
    // else return with an error.
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

export default router;
