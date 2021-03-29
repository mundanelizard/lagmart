import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import prisma from "../utilities/db";
var router = express.Router();

/* Get Product in user possession */
router.get("/vendor", mandatoryAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        user_id: req.auth?.id,
      },
      include: {
        item_group: true,
        cart: true,
        category: true,
        comments: true,
        order: true,
        rating: true,
        user: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved product",
      data: products
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* All products */
router.get("/all", async (_, res) => {
  try {
    const product = await prisma.product.findMany({
      where: {},
      include: {
        item_group: true,
        user: true,
        rating: true,
        order: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved all products",
      data: product,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Search product in stock */
router.get("/search", async (req, res) => {
  try {
    const search = req.query.search as string;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            description: {
              contains: search,
            },
            title: {
              contains: search,
            },
            excerpt: {
              contains: search,
            },
          },
        ],
      },
      include: {
        item_group: true,
        user: true,
        rating: true,
        order: true,
      },
    });

    res.send({
      data: products,
      message: "",
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

/* Get product that is in out of stock. */
router.get("/:id", async (req, res) => {
  try {
    const product_id = Number(req.params.id);

    if (!product_id) {
      throw new Error("Invalid product_id.");
    }

    const product = await prisma.product.findUnique({
      where: {
        id: product_id,
      },
      include: {
        item_group: true,
        category: true,
        cart: true,
        comments: true,
        order: true,
        rating: true,
        user: true,
        wishlist: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully fetched product",
      data: product,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Create product. */
router.post("/create", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role === "USER") {
      throw new Error("You can't create a product with your current role.");
    }

    const {
      items,
      title,
      excerpt,
      description,
      price,
      category_id,
      stock,
    } = req.body;

    if (!Array.isArray(items) || items.length < 0) {
      throw new Error("You can't create product with no length.");
    } else if (typeof title !== "string" || !title) {
      throw new Error("You can't create a product with out a title.");
    } else if (typeof excerpt !== "string" || !excerpt) {
      throw new Error("You can't create new prodouct without an excerpt.");
    } else if (typeof price !== "number" || !price) {
      throw new Error("You can't create a new product without a price.");
    } else if (typeof description !== "string" || !description) {
      throw new Error("You can't create new product with out a description");
    } else if (typeof category_id !== "number" || !category_id) {
      throw new Error(
        "You can't create product that doesn't belong to a category."
      );
    } else if (typeof stock !== "number") {
      throw new Error("Invalid stock.");
    }

    const product = await prisma.product.create({
      data: {
        user_id: req.auth?.id as string,
        category_id,
        excerpt,
        price,
        description,
        title,
        stock,
      },
    });

    const itemGroupPromises = items.map((i) =>
      prisma.itemGroup.create({
        data: {
          product_id: product.id,
          item_id: i as number,
        },
      })
    );

    await Promise.all(itemGroupPromises);

    res.send({
      error: false,
      message: "Successfully created new product.",
      data: product,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Update product. */
router.put("/update", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role === "USER") {
      throw new Error("You can't create a product with your current role.");
    }

    const {
      title,
      excerpt,
      description,
      price,
      category_id,
      stock,
      product_id,
    } = req.body;

    if (typeof title !== "string" || !title) {
      throw new Error("You can't create a product with out a title.");
    } else if (typeof excerpt !== "string" || !excerpt) {
      throw new Error("You can't create new prodouct without an excerpt.");
    } else if (typeof price !== "number" || !price) {
      throw new Error("You can't create a new product without a price.");
    } else if (typeof description !== "string" || !description) {
      throw new Error("You can't create new product with out a description");
    } else if (typeof category_id !== "number" || !category_id) {
      throw new Error(
        "You can't create product that doesn't belong to a category."
      );
    } else if (typeof stock !== "number") {
      throw new Error("Invalid stock.");
    } else if (typeof product_id !== "number") {
      throw new Error("Expecting a valid product");
    }

    const product = await prisma.product.findFirst({
      where: {
        id: product_id,
      },
    });

    if (product?.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw new Error(
        "Product doesn't belong to you and you don't have't the right role to delete it."
      );
    }

    await prisma.product.update({
      where: {
        id: product_id,
      },
      data: {
        category_id,
        excerpt,
        price,
        description,
        title,
        stock,
      },
    });

    res.send({
      error: false,
      message: "Successfully updated new product.",
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

/* Delete product. */
router.delete("/delete", mandatoryAuth, async (req, res) => {
  try {
    const product_id = Number(req.query.item_id);

    if (!product_id) {
      throw new Error("Invalid product_id.");
    }

    await prisma.product.delete({
      where: {
        id: product_id,
      },
      include: {
        item_group: true,
      },
    });

    await prisma.itemGroup.deleteMany({
      where: {
        product_id,
      },
    });

    res.send({
      error: false,
      message: "Successfully cresate user.",
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

/* Rate product. */
router.put("/rating", mandatoryAuth, async (req, res) => {

})

/* Comment on product. */
router.put("/comment", mandatoryAuth, async (req, res) => {

})

export default router;
