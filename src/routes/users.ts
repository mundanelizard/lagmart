import express from "express"
import auth from "../middlewares/auth";
import { SignupRequestBody } from "../types";
import prisma from "../utilities/db";
import { sendValidationMail, validateEmail, validateName } from "../utilities/helpers";
import { hash } from 'bcrypt'
import { SALT_ROUNDS } from "../utilities/consts";
import { FAILED_SIGNUP_REDIRECT, SUCCESS_SIGNUP_REDIRECT } from "../utilities/config";
var router = express.Router();


/* GET users listing. */
router.post("/", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: "string"
      }
    })

  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})


/* Create a user with role */
router.post("/create", auth, async (req, res) => {
  try {
    const { first_name, last_name, email, password, role }: SignupRequestBody = req.body

    if (!validateName(first_name) || !validateName(last_name)) {
      throw new Error("Invalid 'first_name' or last_name. 'first_name' and last_name expected to be greater than length 1.")
    }

    if (!validateEmail(email)) {
      throw new Error("Invalid email. please check the email and try again.")
    }

    if (password.length < 8) {
      throw new Error("Invalid password. Password expected to be greater than six.")
    }

    if (req.auth && req.auth.role !== "SUPER") {
      throw new Error("User is still validated and is not an admin.")
    } else if (req.auth && req.auth.role === "SUPER") {
      if (role !== "ADMIN" && role !== "USER" && role !== "SUPER" && role !== "VENDOR") {
        throw new Error("Invalid user role type. Expecting 'USER', 'ADMIN', 'SUPER' or 'VENDOR'")
      }

      await prisma.user.create({
        data: {
          first_name,
          last_name,
          email: email.toLowerCase(),
          password: await hash(password, SALT_ROUNDS),
          role: role
        }
      })


      await sendValidationMail(email, first_name)

      return res.send({
        error: false,
        message: `Successfully created new ${role?.toLowerCase()}.`,
        data: null
      })
    }

    await prisma.user.create({
      data: {
        first_name,
        last_name,
        email: email.toLowerCase(),
        password: await hash(password, SALT_ROUNDS)
      }
    })

    await sendValidationMail(email, first_name)

    res.send({
      error: false,
      message: `Successfully created new user.`,
      data: null
    })
  } catch (error) {
    res.status(400).send({
      error: true,
      message: error.message,
      data: null
    })
  }
})

/* Validate a Users */
router.get("/validate", async (req, res) => {
  try {
    const { email, id } = req.query

    if (typeof email !== "string") {
      throw new Error("Expected a valid 'email' address as a query.")
    } else if (!Number(id)) {
      throw new Error("Expected a valid 'id' as a query.")
    }

    await prisma.userValidation.delete({
      where: {
        id: Number(id)
      }
    })

    await prisma.user.update({
      where: {
        email: email as string,
      },
      data: {
        status: "ACTIVE"
      }
    })

    res.redirect(SUCCESS_SIGNUP_REDIRECT as string)
  } catch (error) {
    res.status(301).redirect(FAILED_SIGNUP_REDIRECT as string)
  }
})

export default router;
