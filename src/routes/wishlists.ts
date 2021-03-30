import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import prisma from "../utilities/db";

const router = express.Router();

router.get("/all", mandatoryAuth, async (req, res) => {
  try {
    let result = null;

    switch (req.auth?.role) {
      case "ADMIN":
        result = await prisma.wishlist.findMany({ include: { product: true } });
        break;
      default:
        result = await prisma.wishlist.findMany({
          where: {
            user_id: req.auth?.id,
          },
          include: {
            product: true,
          },
          orderBy: {
            wishlist_name: "asc",
          },
          distinct: "wishlist_name",
        });
    }

    res.send({
      error: false,
      message: "Successfully retrieved all wishlists",
      data: result,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

router.get("/:id", mandatoryAuth, async (req, res) => {
  try {
    res.send({
      message: "Successfully retrieved wishlist.",
      error: false,
      data: await prisma.wishlist.findUnique({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          product: {
            include: {
              ratings: true,
              wishlist: true,
              user: true,
              category_group: {
                include: {
                  category: true,
                },
              },
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

router.post("/add", mandatoryAuth, async (req, res) => {
  try {
    const { wishlist_name, product_id } = req.body;

    const wishlistItem = await prisma.wishlist.create({
      data: {
        product_id,
        user_id: req.auth?.id as string,
        wishlist_name: wishlist_name,
      },
    });

    res.send({
      error: false,
      message: "Successfully created wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

router.delete("/remove/:id", mandatoryAuth, async (req, res) => {
  try {
    await prisma.wishlist.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    res.send({
      message: "Successfully removed product from wishlist.",
      data: null,
      error: false,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

router.delete("/delete", mandatoryAuth, async (req, res) => {
  try {
    const { wishlist_name } = req.body;

    await prisma.wishlist.deleteMany({
      where: {
        user_id: req.auth?.id,
        wishlist_name,
      },
    });

    res.send({
      message: "Successfully deleted all wishlist with associated name",
      error: false,
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
