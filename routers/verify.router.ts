import express, { Request, Response } from "express";
import * as nodemailer from "nodemailer";
import { load } from "ts-dotenv";
import { SHA256 } from "crypto-js";
import STATUS_CODES from "../models/status";

const env = load({
  EMAIL: String,
  EMAIL_PASS: String,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL,
    pass: env.EMAIL_PASS,
  },
});

export const verifyRouter = express.Router();

verifyRouter.use(express.json());

const getVerificationCode = (email: string) => {
  return SHA256(
    email +
      (
        Math.floor(Date.now() / (2 * 60 * 1000)) *
        Math.floor(Date.now() / (2 * 60 * 1000))
      ).toString(),
  )
    .toString()
    .replace(/[^0-9]/g, "")
    .substring(0, 6);
};

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )?.[0];
};

// verifyRouter.post('/send', async (req: Request, res: Response) => {
//   const number: string =
//     req?.body?.number[0] === '+'
//       ? req?.body?.number
//       : (('+57' + req?.body?.number) as string);
//   if (req?.body?.number === '') {
//     return res.status(404).send({error: true, msg: 'Please add a number!'});
//   }
//   let verification;
//   try {
//     verification = await twilio.verify.v2
//       .services(env.TW_VSID)
//       .verifications.create({
//         to: number,
//         channel: 'sms',
//       });
//     if (verification.status === 'pending') {
//       res.status(200).send({error: false, msg: 'The code has been sent!'});
//     } else if (!verification.lookup.valid) {
//       res
//         .status(404)
//         .send({error: true, msg: 'The phone number does not exist!'});
//     } else {
//       res
//         .status(404)
//         .send({error: true, msg: 'There was an error sending the code!'});
//     }
//   } catch (error: any) {
//     console.log(error);
//     if (error.status === 429) {
//       return res.status(404).send({
//         error: true,
//         msg: 'Too many attempts, try again in 10 minutes!',
//       });
//     }
//     res.status(404).send({error: true, msg: 'Unable to send the Twilio code!'});
//   }
// });

verifyRouter.post("/send", async (req: Request, res: Response) => {
  const email: string = req.body.email;
  const service: string = req.body.service;
  if (email === "" || !validateEmail(email)) {
    return res.status(404).send({ status: STATUS_CODES.INVALID_EMAIL });
  } else if (service === "") {
    return res.status(404).send({ status: STATUS_CODES.INVALID_SERVICE });
  }
  try {
    //send emailz
    const info = await transporter.sendMail({
      from: env.EMAIL,
      to: email,
      subject: service,
      html: `
      <!DOCTYPE html>
      <html>
      
      <head>
        <meta charset="utf-8">
        <title>Verification Code</title>
      </head>
      
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #333333; margin-bottom: 20px;">Verification Code</h1>
          <img style="width:250px;" src="cid:${email}"/>
          <p style="color: #666666; margin-bottom: 10px;">Your verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #333333; margin-top: 30px; margin-bottom: 40px;">${getVerificationCode(
            email,
          )}</p>
          <p style="color: #666666; margin-bottom: 10px;">Use this code to verify your account</p>
        </div>
      </body>
      
      </html>
    `,
      attachments: [
        {
          filename: "logo.jpg",
          path: process.cwd() + "/images/logo.jpg",
          cid: email, //same cid value as in the html img src
        },
      ],
      // text: `Tu codigo para Foro Pensando en Colombia es ${getVerificationCode(
      //   email,
      // )}`,
    });
    if (info.accepted) {
      res.status(200).send({ status: STATUS_CODES.SENT_CODE });
    } else if (!info.rejected) {
      res.status(404).send({ status: STATUS_CODES.EMAIL_NOT_EXIST });
    } else {
      res.status(404).send({ status: STATUS_CODES.ERROR_SENDING_CODE });
    }
  } catch (error: unknown) {
    console.log(error);
    return res.status(404).send({ status: STATUS_CODES.ERROR_SENDING_CODE });
  }
});

verifyRouter.post("/check", async (req: Request, res: Response) => {
  const email: string = req?.body?.email;
  const code: string = req?.body?.code as string;
  if (code.length !== 6) {
    return res.status(404).send({ status: STATUS_CODES.CODE_DENIED });
  }
  try {
    if (getVerificationCode(email) === code) {
      res.status(200).send({ status: STATUS_CODES.SUCCESS });
    } else {
      res.status(404).send({ status: STATUS_CODES.CODE_DENIED });
    }
  } catch (error: unknown) {
    res.status(404).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});
