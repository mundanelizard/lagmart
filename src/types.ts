import { Cart, Product } from ".prisma/client";

export interface SignupRequestBody {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "USER" | "VENDOR" | "SUPER";
}

export interface SigninRequestBody {
  email: string;
  password: string;
}

export interface ValidateUserQuery {
  email: string;
  id: string;
}

export interface CreateItemRequestBody {
  title: string;
  description: string;
  price: number;
}

export interface UpdateItemRequestBody extends CreateItemRequestBody {
  item_id: number;
}

export interface CreateDiscountBody {
  discount_code: string;
  discount_name: string;
  percent: number;
  ends: string;
}

export interface UpdateDiscountBody extends CreateDiscountBody {
  discount_id: number;
}

export interface CartWithProduct extends Cart {
  product: Product
}