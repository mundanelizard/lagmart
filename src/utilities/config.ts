import * as path from 'path'
import { config } from 'dotenv'
config({ path: path.join(__dirname, "../../.env") });

export const PORT = process.env.PORT;
export const STATIC = process.env.STATIC || "public";
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
export const VALIDATION_EMAIL_GREETING = process.env.VALIDATION_EMAIL_GREETING
export const VALIDATION_EMAIL_CONCLUSION = process.env.VALIDATION_EMAIL_CONCLUSION
export const EMAIL_SIGNOUT = process.env.EMAIL_SIGNOUT
export const BASE_API = process.env.BASE_API