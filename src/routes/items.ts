import express from "express";
import { mandatoryAuth } from "../middlewares/auth";
import { CreateItemRequestBody, UpdateItemRequestBody } from "../types";
import prisma from "../utilities/db";
const router = express.Router();

/* Get Items in user possession */
router.get("/vendor", mandatoryAuth, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        user_id: req.auth?.id,
      },
      include: {
        item_group: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved item.",
      data: items,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* All items */
router.get("/all", async (_, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {},
      include: {
        item_group: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully all items.",
      data: items,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Search items */
router.get("/search", async (req, res) => {
  try {
    const search = req.query.search as string;

    const items = await prisma.item.findMany({
      where: {
        OR: [
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved data.",
      data: items,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* GET an item. */
router.get("/:id", async (req, res) => {
  try {
    const item_id = Number(req.params.id);

    if (!item_id) {
      throw new Error("Invalid item_id.");
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id,
      },
      include: {
        item_group: {
          include: {
            product: true
          }
        },
        user: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully fetched item.",
      data: item,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Creates a new item */
router.post("/create", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role === "USER") {
      throw new Error("You can't create an item with your current role.");
    }

    const { title, description, price }: CreateItemRequestBody = req.body;

    if (typeof price !== "number" || !price) {
      throw new Error("Invalid item price.");
    } else if (typeof description !== "string" || !description) {
      throw new Error("Invalid item description.");
    } else if (typeof title !== "string" || !description) {
      throw new Error("Invalid item price.");
    }

    const item = await prisma.item.create({
      data: {
        title,
        description,
        price,
        user_id: req.auth?.id as string,
      },
    });

    res.send({
      error: false,
      message: "Successfully created item.",
      data: item,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Deletes a component */
router.delete("/delete/:item_id", mandatoryAuth, async (req, res) => {
  try {
    const item_id = Number(req.params.item_id);

    if (!item_id) {
      throw new Error("Invalid item_id.");
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id,
      },
      include: {
        item_group: true,
      },
    });

    if (item?.item_group && item?.item_group.length > 0) {
      throw new Error(
        "Can't delete items that have active linking to a product."
      );
    }

    if (item?.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw new Error(
        "Item doesn't belong to you and you don't have the right role to delete it."
      );
    }

    await prisma.item.update({
      where: {
        id: item_id,
      },
      data: {
        is_deleted: true,
      },
    });

    res.send({
      error: false,
      message: "Successfully deleted item.",
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

/* Updates a component */
router.put("/update", mandatoryAuth, async (req, res) => {
  try {
    const {
      price,
      title,
      description,
      item_id,
    }: UpdateItemRequestBody = req.body;

    if (!item_id) {
      throw new Error("Invalid item_id.");
    } else if (!title) {
      throw new Error("Invalid title.");
    } else if (!description) {
      throw new Error("Invalid description.");
    } else if (!price) {
      throw new Error("Invalid price.");
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id,
      },
    });

    if (item?.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw new Error(
        "Product doesn't belong to you and you don't have the right role to update it."
      );
    }

    const newItem = await prisma.item.update({
      where: {
        id: item_id,
      },
      data: {
        description,
        price,
        title,
      },
    });

    res.send({
      error: false,
      message: "Successfully update item.",
      data: newItem,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

// todo - add comments and rating

export default router;
