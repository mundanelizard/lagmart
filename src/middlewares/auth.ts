import { Response, Request } from 'express'
import { verify } from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../utilities/config"
import prisma from "../utilities/db"

export interface AuthObject {
  id: string,
  first_name: string,
  last_name: string,
  role: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthObject
    }
  }
}

export const optionalAuth = async (req: Request, res: Response, next: () => void) => {
  try {
    const authorization = req.headers["Authorization"] as string
    if (!authorization) {
      return next()
    }

    const token = authorization.split(' ')[1]

    if (!token) {
      throw new Error("Invalid 'Authorization' header.")
    }


    req.auth = verify(token, ACCESS_TOKEN_SECRET as string) as AuthObject

    const authObj = await prisma.auth.findFirst({
      where: {
        access_token: token,
        user_id: req.auth.id
      }
    })

    if (!authObj) {
      throw new Error("Fraudulent access_token.")
    }

    next()
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
}

export const mandatoryAuth = async (req: Request, res: Response, next: () => void) => {
  try {
    const authorization = req.headers["Authorization"] as string
    if (!authorization) {
      throw new Error("Authentication is mandatory to access this endpoint.")
    }

    const token = authorization.split(' ')[1]

    if (!token) {
      throw new Error("Invalid 'Authorization' header.")
    }

    req.auth = verify(token, ACCESS_TOKEN_SECRET as string) as AuthObject

    const authObj = await prisma.auth.findFirst({
      where: {
        access_token: token,
        user_id: req.auth.id
      }
    })

    if (!authObj) {
      throw new Error("Fraudulent access_token.")
    }

    next()
  } catch (error) {
    res.send({
      error: true,
      message: error.message,
      data: null
    })
  }
}