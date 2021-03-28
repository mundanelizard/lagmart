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
export const FAILED_SIGNUP_REDIRECT = process.env.FAILED_SIGNUP_REDIRECT
export const SUCCESS_SIGNUP_REDIRECT = process.env.SUCCESS_SIGNUP_REDIRECT
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
export const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY
export const PAYMENT_ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY

export const FLUTTERWAVE_VALIDATE_URL =
  "https://api.flutterwave.com/v3/validate-charge";
export const FLUTTERWAVE_INSTANTIATE_URL =
  "https://api.flutterwave.com/v3/charges?type=card";