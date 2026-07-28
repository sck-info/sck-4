import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(email: string, name: string, resetUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #faf7f2; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #faf7f2; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(28,31,74,0.08);">
              <tr>
                <td style="padding: 40px 36px 20px; text-align: center; background: #1c1f4a;">
                  <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Sharath Chandra Kancherla</h1>
                  <p style="color: #e8962e; font-size: 11px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Password Reset</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 36px 24px;">
                  <p style="color: #1c1f4a; font-size: 15px; margin: 0 0 16px; line-height: 1.6;">Dear ${name},</p>
                  <p style="color: #5a5e7a; font-size: 13px; margin: 0 0 20px; line-height: 1.6;">We received a request to reset your password for your SCK account. Click the button below to set a new password. This link expires in 1 hour.</p>
                  <table cellpadding="0" cellspacing="0" style="margin: 24px auto;">
                    <tr>
                      <td align="center" style="background: #b86a16; border-radius: 50px; padding: 12px 32px;">
                        <a href="${resetUrl}" style="color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; letter-spacing: 0.5px; display: inline-block;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #5a5e7a; font-size: 12px; margin: 20px 0 0; line-height: 1.6;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
                  <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 24px 0 16px;" />
                  <p style="color: #9396ae; font-size: 11px; margin: 0; line-height: 1.5;">Thank You,<br/><span style="color: #b86a16; font-weight: 600;">Sharath Kancherla Admin Team</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Sharath Kancherla" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your SCK Password",
    html,
  });
}
