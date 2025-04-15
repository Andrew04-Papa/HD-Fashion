import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

export const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USERNAME}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  // Send email
  await transporter.sendMail(mailOptions)
}

