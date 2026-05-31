import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Fluent" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Fluent password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to choose a new password (valid for 1 hour):</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}
