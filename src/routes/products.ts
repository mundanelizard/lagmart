import express from "express";
import { userInfo } from "node:os";
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
        category_group: {
          include: {
            category: true,
          },
        },
        comments: true,
        order: true,
        ratings: true,
        user: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved product",
      data: products,
    });
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
        ratings: true,
        order: true,
        category_group: {
          include: {
            category: true,
          },
        },
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
        ratings: true,
        order: true,
        category_group: {
          include: {
            category: true,
          },
        },
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
        category_group: {
          include: {
            category: true,
          },
        },
        cart: true,
        comments: true,
        order: true,
        ratings: true,
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
      category_ids,
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
    } else if (!Array.isArray(category_ids)) {
      throw new Error(
        "You can't create product that doesn't belong to a category."
      );
    } else if (typeof stock !== "number") {
      throw new Error("Invalid stock.");
    }

    const product = await prisma.product.create({
      data: {
        user_id: req.auth?.id as string,
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

    const categoryGroupPromises = category_ids.map((i) =>
      prisma.categoryGroup.create({
        data: {
          category_id: i,
          product_id: product.id,
        },
      })
    );

    await Promise.all([...itemGroupPromises, ...categoryGroupPromises] as Array<
      Promise<any>
    >);

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
      category_ids,
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
    } else if (!Array.isArray(category_ids)) {
      throw new Error(
        "You can't create product that doesn't belong to a category."
      );
    } else if (typeof stock !== "number") {
      throw new Error("Invalid stock.");
    } else if (typeof product_id !== "number") {
      throw new Error("Expecting a valid product");
    }

    const product = await prisma.product.findUnique({
      where: {
        id: product_id,
      },
      include: {
        category_group: true,
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
        excerpt,
        price,
        description,
        title,
        stock,
      },
    });

    const shouldCategoriesUpdate =
      category_ids.length !== product?.category_group.length ||
      category_ids.some((i, index) => i !== product?.category_group[index]);

    if (shouldCategoriesUpdate) {
      await prisma.categoryGroup.deleteMany({
        where: {
          product_id: product?.id,
        },
      });

      const categoryGroupPromises = category_ids.map((i) =>
        prisma.categoryGroup.create({
          data: {
            category_id: i,
            product_id: product?.id as number,
          },
        })
      );

      await Promise.all(categoryGroupPromises);
    }

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
router.post("/rate", mandatoryAuth, async (req, res) => {
  try {
    const { rating, product_id, item_id } = req.body;

    if (typeof rating !== "number" || rating > 10 || rating < 0) {
      throw new Error("Invalid rating.");
    }

    if (typeof product_id === "number" && product_id) {
      const previousRating = await prisma.rating.findFirst({
        where: {
          user_id: req.auth?.id,
          product_id,
        },
      });

      if (previousRating) {
        throw new Error("You can't rate a product more than once.");
      }

      await prisma.rating.create({
        data: {
          rating,
          product_id,
          user_id: req.auth?.id as string,
        },
      });
    } else if (typeof item_id === "number" && item_id) {
      const previousRating = await prisma.rating.findFirst({
        where: {
          user_id: req.auth?.id,
          item_id,
        },
      });

      if (previousRating) {
        throw new Error("You can't rate a product more than once.");
      }

      await prisma.rating.create({
        data: {
          rating,
          item_id,
          user_id: req.auth?.id as string,
        },
      });
    } else {
      throw new Error("Invalid product_id or item_id.");
    }
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Rate product. */
router.put("/rate", mandatoryAuth, async (req, res) => {
  try {
    const { rating, rating_id } = req.body;

    if (typeof rating !== "number" || rating > 10 || rating < 0) {
      throw new Error("Invalid rating.");
    }

    const prevRating = await prisma.rating.findFirst({
      where: { user_id: req.auth?.id, id: rating_id },
    });

    if (!prevRating) {
      throw new Error("Can not update rating that doesn't belong to you.");
    }

    await prisma.rating.update({
      where: {
        id: rating_id,
      },
      data: {
        rating,
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

/* Comment on product. */
router.post("/comment", mandatoryAuth, async (req, res) => {});

/* Rate product. */
router.post("/category", mandatoryAuth, async (req, res) => {
  try {
    const { category_name } = req.body;

    if (typeof category_name !== "string" || !category_name) {
      throw new Error("Invalid category_name.");
    } else if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid permission level.");
    }

    const category = await prisma.category.create({
      data: {
        category_name: category_name,
      },
    });

    res.send({
      data: category,
      error: false,
      message: "Successfull created category.",
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Comment on product. */
router.put("/category", mandatoryAuth, async (req, res) => {
  try {
    const { category_name, category_id } = req.body;

    if (typeof category_name !== "string" || !category_name) {
      throw new Error("Invalid category_name.");
    } else if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid permission level.");
    }

    const category = await prisma.category.update({
      where: {
        id: category_id,
      },
      data: {
        category_name: category_name,
      },
    });

    res.send({
      data: category,
      error: false,
      message: "Successfull updated category.",
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Comment on product. */
router.delete("/category/:category_id", mandatoryAuth, async (req, res) => {
  try {
    const { category_id } = req.params;
    if (req.auth?.role !== "SUPER") {
      throw new Error("Invalid permission level.");
    }

    await prisma.category.delete({
      where: {
        id: Number(category_id),
      },
    });

    await prisma.categoryGroup.deleteMany({
      where: {
        category_id: Number(category_id),
      },
    });

    res.send({
      data: null,
      error: false,
      message: "Successfull created category.",
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
