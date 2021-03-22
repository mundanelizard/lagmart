import mailer from "@sendgrid/mail"
import { SENDGRID_API_KEY, VALIDATION_EMAIL_CONCLUSION, VALIDATION_EMAIL_GREETING, EMAIL_SIGNOUT, BASE_API } from "./config";
import db from "./db";

mailer.setApiKey(SENDGRID_API_KEY as string)


export function validateName(name: string) {
  return name.length > 1
}

export function validateEmail(email: string) {
  var regex = /^(\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*\s*[,]?\b)*$/;
  return email.length <= 150 && regex.test(email);
}

export async function sendEmail(to: string, subject: string, htmlBody: string, textBody: string) {
  const msg = {
    to,
    from: "admin@renewedlifeglobal.com",
    subject,
    text: textBody,
    html: htmlBody
  }

  await mailer.send(msg)
}

export async function sendValidationMail(email: string, firstName: string) {
  const userValidation = await db.userValidation.create({ data: { email } });
  const validationLink = BASE_API  + "/users/validate?email=" + userValidation.email + "&id=" + userValidation.id

  const htmlBody = `
  <p>Hello ${firstName},</p>

  <p>${VALIDATION_EMAIL_GREETING}</p>

  <p><a href="${encodeURI(validationLink)}">Validated Account</a></p>

  <p>${VALIDATION_EMAIL_CONCLUSION}</p>

  <p></p>

  <p>${EMAIL_SIGNOUT}</p>
  `
  
  const textBody = `
  Hello ${firstName}

  ${VALIDATION_EMAIL_GREETING}

  ${encodeURI(validationLink)}

  ${VALIDATION_EMAIL_CONCLUSION}


  ${EMAIL_SIGNOUT}
  `

  await sendEmail(email, "Account Verification", htmlBody, textBody)
}