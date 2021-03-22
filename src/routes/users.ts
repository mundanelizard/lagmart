import express from "express"
import auth from "../middlewares/auth";
import { SignupRequestBody } from "../types";
import db from "../utilities/db";
import { validateEmail, validateName } from "../utilities/helpers";
var router = express.Router();

/* GET users listing. */
router.post("/", auth, async (req, res) =>{
  try {
    const user = await db.user.findUnique({
      where: {
        id: "string"
      }
    })

  }catch(error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})


/* Create a user with role */
router.post("/create", auth, async (req, rest) => {
  try {
    const { first_name, last_name, email, password }: SignupRequestBody = req.body

    if (!validateName(first_name) || !validateName(last_name)) {
      throw new Error("Invalid first_name or last_name. first_name and last_name expected to be greater than length 1.")
    }

    if (!validateEmail(email)) {
      throw new Error("Invalid email. please check the email and try again.")
    }

    if (password.length < 8) {
      throw new Error("Invalid password. Password expected to be greater than six.")
    }

    

  } catch(error) {
    rest.send({
      error: true,
      message: error.message,
      data: null
    })
  }
})

export default router;
