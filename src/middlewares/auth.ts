interface AuthObject {
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
  req.auth = { id: "id", first_name: "first_name", "last_name": "last_name", "role": "user"}
  next()
}