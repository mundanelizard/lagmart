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

export default (req:Express.Request, res: Express.Response, next: () => void) => {
  // req.auth = { first_name: "samuel", "last_name": "omohan", "id": "user_id", "role": "SUPER"}
  next()
}