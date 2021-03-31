import express from "express";
import { AuthObject, mandatoryAuth, optionalAuth } from "../middlewares/auth";
import { SignupRequestBody, SigninRequestBody } from "../types";
import prisma from "../utilities/db";
import {
  sendValidationMail,
  validateEmail,
  validateName,
} from "../utilities/helpers";
import { compare, hash } from "bcrypt";
import { SALT_ROUNDS } from "../utilities/consts";
import {
  ACCESS_TOKEN_SECRET,
  FAILED_SIGNUP_REDIRECT,
  REFRESH_TOKEN_SECRET,
  SUCCESS_SIGNUP_REDIRECT,
} from "../utilities/config";
import { verify, sign } from "jsonwebtoken";
const router = express.Router();

/* GET users listing. */
router.get("/user/:id", mandatoryAuth, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        auth: false,
        email: true,
        created_at: true,
        update_at: true,
        password: false,
        first_name: true,
        last_name: true,
        status: true,
        role: true,
        card_payment: true,
        cart: true,
        comments: true,
        items: true,
        order_groups: true,
        products: true,
        ratings: true,
        redeemed: true,
        wishlists: true,

      },
    });

    res.send({
      error: false,
      message: "Successfully retrieved user.",
      data: user,
    });
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Create a user with role */
router.post("/create", optionalAuth, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role,
    }: SignupRequestBody = req.body;

    if (!validateName(first_name) || !validateName(last_name)) {
      throw new Error(
        "Invalid 'first_name' or last_name. 'first_name' and last_name expected to be greater than length 1."
      );
    }

    if (!validateEmail(email)) {
      throw new Error("Invalid email. please check the email and try again.");
    }

    if (password.length < 8) {
      throw new Error(
        "Invalid password. Password expected to be greater than six."
      );
    }

    if (req.auth && req.auth.role !== "SUPER") {
      throw new Error("User is still validated and is not an admin.");
    } else if (req.auth && req.auth.role === "SUPER") {
      if (
        role !== "ADMIN" &&
        role !== "USER" &&
        role !== "SUPER" &&
        role !== "VENDOR"
      ) {
        throw new Error(
          "Invalid user role type. Expecting 'USER', 'ADMIN', 'SUPER' or 'VENDOR'"
        );
      }

      await prisma.user.create({
        data: {
          first_name,
          last_name,
          email: email.toLowerCase(),
          password: await hash(password, SALT_ROUNDS),
          role: role,
        },
      });

      await sendValidationMail(email, first_name);

      return res.send({
        error: false,
        message: `Successfully created new ${role?.toLowerCase()}.`,
        data: null,
      });
    }

    await prisma.user.create({
      data: {
        first_name,
        last_name,
        email: email.toLowerCase(),
        password: await hash(password, SALT_ROUNDS),
      },
    });

    await sendValidationMail(email, first_name);

    res.send({
      error: false,
      message: `Successfully created new user.`,
      data: null,
    });
  } catch (error) {
    res.status(400).send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

/* Validate a user email */
router.get("/validate", async (req, res) => {
  try {
    const { email, id } = req.query;

    if (typeof email !== "string") {
      throw new Error("Expected a valid 'email' address as a query.");
    } else if (!Number(id)) {
      throw new Error("Expected a valid 'id' as a query.");
    }

    await prisma.userValidation.delete({
      where: {
        id: Number(id),
      },
    });

    await prisma.user.update({
      where: {
        email: email as string,
      },
      data: {
        status: "ACTIVE",
      },
    });

    res.redirect(SUCCESS_SIGNUP_REDIRECT as string);
  } catch (error) {
    res.status(301).redirect(FAILED_SIGNUP_REDIRECT as string);
  }
});

/* Signs a user in to the application */
router.post("/signin", optionalAuth, async (req, res) => {
  try {
    if (req.auth) {
      throw new Error("Please signout before attempting to login as new user.");
    }

    const { email, password }: SigninRequestBody = req.body;

    if (password.length < 10) {
      throw new Error(
        "Invalid password, expecting password of atleast length 8."
      );
    } else if (!validateEmail(email)) {
      throw new Error("Invalid email, expecting a valid.");
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new Error("User with email doesn't exists.");
    } else if (!(await compare(password, user.password))) {
      throw new Error("Wrong password.");
    } else if (user.status === "PENDING") {
      await sendValidationMail(user.email, user.first_name, true);
      throw new Error(
        "Your account is hasn't been verified. A new verification email has been sent to you."
      );
    } else if (user.status === "DELETED") {
      await sendValidationMail(user.email, user.first_name);
      throw new Error(
        "Your account has been deleted to activate it, click on the verification email sent to you."
      );
    } else if (user.status === "INACTIVE") {
      throw new Error(
        "Your account has been deactivated by the administrator. Contact an administrator to activate your account."
      );
    }

    const auth: AuthObject = {
      first_name: user.first_name,
      last_name: user.last_name,
      id: user.id,
      role: user.role,
    };

    const accessToken = sign(auth, ACCESS_TOKEN_SECRET as string, {
      expiresIn: "30m",
    });
    const refreshToken = sign(auth, REFRESH_TOKEN_SECRET as string, {
      expiresIn: "30d",
    });

    await prisma.auth.create({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: user.id,
      },
    });

    res.cookie("refresh_token", refreshToken, {
      path: "/users/refresh_token",
      httpOnly: true,
    });

    res.send({
      message: "Successfully authenticated user.",
      error: false,
      data: accessToken,
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
      error: true,
      data: null,
    });
  }
});

/* Refreshes tokens */
router.post("/refresh_token", async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refresh_token as string;
    const auth = verify(
      oldRefreshToken,
      REFRESH_TOKEN_SECRET as string
    ) as AuthObject;

    const newAuth = {
      first_name: auth.first_name,
      last_name: auth.last_name,
      role: auth.role,
      id: auth.id
    }

    const accessToken = sign(newAuth, ACCESS_TOKEN_SECRET as string, {
      expiresIn: "30m",
    });
    const refreshToken = sign(newAuth, REFRESH_TOKEN_SECRET as string, {
      expiresIn: "30d",
    });

    const prevAuth = await prisma.auth.findFirst({
      where: {
        refresh_token: oldRefreshToken,
      },
    });

    if (!prevAuth) {
      throw new Error("Fraudalent refresh_token.");
    }

    await prisma.auth.update({
      where: {
        id: prevAuth.id,
      },
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

    res.cookie("refresh_token", refreshToken, {
      path: "/users/refresh_token",
      httpOnly: true,
    });

    res.send({
      message: "Successfully refreshed user token.",
      error: false,
      data: accessToken,
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
      error: true,
      data: null,
    });
  }
});

/* Deletes user */
router.delete("/user/:id", mandatoryAuth, async (req, res) => {
  try {
    const id = String(req.params.id);

    if (req.auth?.role !== "ADMIN" && req.auth?.id !== id) {
      throw new Error("You don't have the right previledge to delete account.")
    }

    await prisma.user.update({
      data: {
        status: "DELETED",
      },
      where: {
        id,
      },
    });

    res.send({
      message: "Successfully deleted user.",
      data: null,
      error: false,
    });
  } catch (error) {
    res.status(400).send({
      error: true,
      message: error.message,
      data: null,
    });
  }
});

// todo - update user details.

export default router;
