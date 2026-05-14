import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export const sendMail = (to: string, subject: string, html: string, text?: string) =>
  mailer.sendMail({ from: process.env.SMTP_FROM, to, subject, html, text });