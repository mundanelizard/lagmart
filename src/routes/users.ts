import express from "express"
import auth, { AuthObject } from "../middlewares/auth";
import { SignupRequestBody, SigninRequestBody } from "../types";
import prisma from "../utilities/db";
import { sendValidationMail, validateEmail, validateName } from "../utilities/helpers";
import { compare, hash } from 'bcrypt'
import { SALT_ROUNDS } from "../utilities/consts";
import { ACCESS_TOKEN_SECRET, FAILED_SIGNUP_REDIRECT, REFRESH_TOKEN_SECRET, SUCCESS_SIGNUP_REDIRECT } from "../utilities/config";
import { verify, sign, JsonWebTokenError } from "jsonwebtoken";
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

router.post("/signin", auth, async (req, res) => {
  try {
    if (req.auth) {
      throw new Error("Please signout before attempting to login as new user.")
    }

    const { email, password }: SigninRequestBody = req.body

    if (password.length < 10) {
      throw new Error("Invalid password, expecting password of atleast length 8.")
    } else if (!validateEmail(email)) {
      throw new Error("Invalid email, expecting a valid.")
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) {
      throw new Error("User with email doesn't exists.")
    } else if (!await compare(password, user.password)) {
      throw new Error("Wrong password.")
    }

    const auth: AuthObject = { first_name: user.first_name, last_name: user.last_name, id: user.id, role: user.role }

    const accessToken = sign(auth, ACCESS_TOKEN_SECRET as string, { expiresIn: "30m" })
    const refreshToken = sign(auth, REFRESH_TOKEN_SECRET as string, { expiresIn: "30d" })

    await prisma.auth.create({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: user.id
      }
    })

    res.cookie("refresh_token", refreshToken, {
      path: "/users/refresh_token",
      httpOnly: true,
    });

    res.send({
      message: "Successfully authenticated user.",
      error: false,
      data: accessToken
    })

  } catch (error) {
    res.status(400).send({
      message: error.message,
      error: true,
      data: null
    })
  }
})

export default router;
