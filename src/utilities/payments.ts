import { User } from ".prisma/client";
import axios from "axios";
import forge from "node-forge";
import {
  FLUTTERWAVE_INSTANTIATE_URL,
  FLUTTERWAVE_VALIDATE_URL,
  PAYMENT_ENCRYPTION_KEY,
  PAYMENT_SECRET_KEY,
} from "./config";

async function makePaymentRequest(url: string, body: object, method = "POST") {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PAYMENT_SECRET_KEY}`,
  };

  const response = await axios({
    method,
    headers,
    data: JSON.stringify(body),
    url: url,
  } as any);

  return response.data;
}

function encrypt(key: string, text: string) {
  const cipher = forge.cipher.createCipher(
    "3DES-ECB",
    forge.util.createBuffer(key)
  );

  cipher.start({ iv: "" });
  cipher.update(forge.util.createBuffer(text, "utf8"));
  cipher.finish();

  const encrypted = cipher.output;
  return forge.util.encode64(encrypted.getBytes());
}

export async function initiateCardPayment(
  amount: number,
  txRef: string,
  cardDetails: object,
  user: User
) {
  const paymentDetails = {
    ...cardDetails,
    email: user.email,
    fullname: `${user.first_name} ${user.last_name}`,
    currency: "NGN",
    tx_ref: txRef,
    amount,
  };

  let encryptedPaymentDetails = encrypt(
    PAYMENT_ENCRYPTION_KEY as string,
    JSON.stringify(paymentDetails)
  );

  let paymentResponse = await makePaymentRequest(FLUTTERWAVE_INSTANTIATE_URL, {
    client: encryptedPaymentDetails,
  });

  if (paymentResponse.status === "error") {
    throw new Error(paymentResponse.message);
  }

  return paymentResponse.data.flw_ref;
}

export async function validateCardPayment(otp: string, flwRef: string) {
  const validateRequest = {
    otp,
    flw_ref: flwRef,
    type: "card",
  };

  const validateResponse = await makePaymentRequest(
    FLUTTERWAVE_VALIDATE_URL,
    validateRequest
  );

  if (validateResponse.status === "error") {
    throw new Error(validateResponse.message);
  }

  return [validateResponse.data.tx_ref, validateResponse.data.amount];
}
