export interface SignupRequestBody {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  role?: "ADMIN" | "USER" | "VENDOR" | "SUPER"
}