export interface SignupRequestBody {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  role?: "ADMIN" | "USER" | "VENDOR" | "SUPER"
}

export interface SigninRequestBody {
  email: string,
  password: string
}

export interface ValidateUserQuery {
  email: string,
  id: string
}