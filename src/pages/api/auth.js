// pages/api/auth.js
import { serialize } from "cookie";
import { parse } from "cookie";
import speakeasy from "speakeasy";
import { toString } from "qrcode";
import nodemailer from 'nodemailer';

async function sendEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your 2FA Code",
        text: `Your 2FA code is ${token}. Please enter this code in the app.`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { name, email } = req.body;

        // Generate a 2FA secret
        const secret = speakeasy.generateSecret({ length: 10 });

        // Generate a QR code from the secret's otpauth URL
        const dataURL = await toString(secret.otpauth_url, { type: "svg" });

        // Generate a token from the secret
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: "base32",
        });

        // Send the token to the user's email
        await sendEmail(email, token);

        // Save the secret to a cookie
        res.setHeader(
            "Set-Cookie",
            serialize("twoFactorAuthSecret", secret.base32, { httpOnly: true, path: "/" })
        );

        // Send the QR code to the client
        res.status(200).json({ dataURL });
    } else if (req.method === "PUT") {
        // Verify the token provided by the user
        const token = req.body.token;
        const secret = parse(req.headers.cookie).twoFactorAuthSecret;

        const verified = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token,
        });

        if (verified) {
            res.status(200).json({ message: "2FA token verified successfully" });
        } else {
            res.status(401).json({ message: "Invalid 2FA token" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
