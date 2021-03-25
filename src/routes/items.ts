import express from 'express'
import { mandatoryAuth } from '../middlewares/auth';
import { CreateItemRequestBody, UpdateItemRequestBody } from '../types';
import prisma from '../utilities/db';
var router = express.Router();

/* Get Component With Name In User Possession */
router.get("/vendor", mandatoryAuth, async (req, res) => {
  try {

    if (req.auth?.role !== 'VENDOR') {
      throw new Error("Only vendors can search vendor product.");
    }

    const name = req.query.search as string;

    const items = await prisma.item.findMany({
      where: {
        OR: [
          {
            description: {
              contains: name
            },
            title: {
              contains: name
            }
          }
        ],
        user_id: req.auth.id
      }
    })

    res.send({
      error: false,
      message: "Successfully retrieved data.",
      data: items
    })

  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})


/* GET a component. */
router.get("/:id", async (req, res) => {
  try {
    const item_id = Number(req.params.id)

    if (!item_id) {
      throw new Error("Invalid item_id.")
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id
      }
    })

    res.send({
      error: false,
      message: "Successfully fetch item.",
      data: item,
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
});

/* Creates a new item */
router.post("/create", mandatoryAuth, async (req, res) => {
  try {
    if (req.auth?.role === "USER") {
      throw new Error("You can't create a post with your current role.")
    }

    const { title, description, price }: CreateItemRequestBody = req.body

    if (typeof price !== "number" || !price) {
      throw new Error("Invalid item price.")
    } else if (typeof description !== "string" || !description) {
      throw new Error("Invalid item description.")
    } else if (typeof title !== "string" || !description) {
      throw new Error("Invalid item price.")
    }

    const item = await prisma.item.create({
      data: {
        title,
        description,
        price,
        user_id: req.auth?.id as string
      }
    })

    res.send({
      error: false,
      message: "Successfully created item.",
      data: item
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})


/** Deletes a component */
router.delete("/delete", mandatoryAuth, async (req, res) => {
  try {
    const item_id = Number(req.query.item_id)

    if (!item_id) {
      throw new Error("Invalid item_id.")
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id
      },
      include: {
        ItemGroup: true
      }
    })

    if (item?.ItemGroup && item?.ItemGroup.length > 0) {
      throw new Error("Can't delete items that have active linking to a product.")
    }

    if (item?.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw new Error("Product doesn't belong to you and you don't have the right role to delete it.")
    }

    await prisma.item.delete({
      where: {
        id: item_id
      }
    })

    res.send({
      error: false,
      message: "Successfully deleted item.",
      data: null
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})

/* Updates a component */
router.put("/update", mandatoryAuth, async (req, res) => {
  try {
    const { price, title, description, item_id }: UpdateItemRequestBody = req.body

    if (!item_id) {
      throw new Error("Invalid item_id.")
    } else if (!title) {
      throw new Error("Invalid title.")
    } else if (!description) {
      throw new Error("Invalid description.")
    } else if (!price) {
      throw new Error("Invalid price.")
    }

    const item = await prisma.item.findUnique({
      where: {
        id: item_id
      }
    })

    if (item?.user_id !== req.auth?.id && req.auth?.role !== "SUPER") {
      throw new Error("Product doesn't belong to you and you don't have the right role to update it.")
    }

    const newItem = await prisma.item.update({
      where: {
        id: item_id
      },
      data: {
        description,
        price,
        title
      }
    })

    res.send({
      error: false,
      message: "Successfully update item.",
      data: newItem
    })
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})



export default router;
