import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const port = Number(process.env.EMAIL_PORT) || 587;

const transportOptions: SMTPTransport.Options = {
  host: process.env.EMAIL_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

const transporter = nodemailer.createTransport(transportOptions);

export async function sendInterviewCodeMail(to: string, interviewId: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Mülakat Kodunuz",
    text: `Merhaba,\n\nMülakat kodunuz: ${interviewId}`,
    html: `<p>Merhaba,</p>
           <p>Mülakat kodunuz: <b>${interviewId}</b></p>`,
  });
}