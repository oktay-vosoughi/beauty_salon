import nodemailer from "nodemailer";

type PasswordResetEmailResult =
  | { status: "sent" }
  | { status: "development"; resetUrl: string };

function hasSmtpCredentials() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (!hasSmtpCredentials()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP credentials are not configured");
    }
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  });
}

const FROM = process.env.SMTP_FROM ?? "Niltellioglu <noreply@niltellioglu.com>";

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<PasswordResetEmailResult> {
  const transport = createTransport();
  if (!transport) {
    console.info(`Password reset link for ${to}: ${resetUrl}`);
    return { status: "development", resetUrl };
  }

  await transport.sendMail({
    from: FROM,
    to,
    subject: "Şifre Sıfırlama — Niltellioglu",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#fff;border:1px solid #eee;border-radius:8px">
        <h2 style="font-size:22px;color:#1a1a1a;margin-bottom:8px">Merhaba ${name},</h2>
        <p style="color:#444;line-height:1.6">Şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz.</p>
        <p style="margin:28px 0;text-align:center">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#c8a87e;color:#fff;border-radius:4px;text-decoration:none;font-weight:600;font-size:15px">
            Şifremi Sıfırla
          </a>
        </p>
        <p style="color:#888;font-size:13px;line-height:1.5">Bu bağlantı <strong>1 saat</strong> geçerlidir. Talepte bulunmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#bbb;font-size:12px;text-align:center">Niltellioglu Cilt Bakım ve Kozmetik</p>
      </div>
    `,
    text: `Merhaba ${name},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n${resetUrl}\n\nBu bağlantı 1 saat geçerlidir.\n\nNiltellioglu`,
  });

  return { status: "sent" };
}
