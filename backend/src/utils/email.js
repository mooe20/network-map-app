import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
const APP_URL = process.env.APP_URL || 'https://network-map-app-production.up.railway.app';

export async function sendVerificationEmail(email, token) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"人脈マップ" <${FROM}>`,
    to: email,
    subject: '【人脈マップ】メールアドレスを確認してください',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">人脈マップへようこそ！</h2>
        <p style="color: #374151; line-height: 1.6;">以下のボタンをクリックしてメールアドレスを認証し、アカウントを有効化してください。</p>
        <a href="${url}" style="display:inline-block; margin: 24px 0; padding: 14px 32px; background: #4f46e5; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          メールアドレスを認証する
        </a>
        <p style="color: #6b7280; font-size: 13px;">このリンクは24時間有効です。</p>
        <p style="color: #6b7280; font-size: 13px;">このメールに心当たりがない場合は無視してください。</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">人脈マップ</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"人脈マップ" <${FROM}>`,
    to: email,
    subject: '【人脈マップ】パスワード再設定',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">パスワード再設定</h2>
        <p style="color: #374151; line-height: 1.6;">パスワード再設定のリクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。</p>
        <a href="${url}" style="display:inline-block; margin: 24px 0; padding: 14px 32px; background: #4f46e5; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
          パスワードを再設定する
        </a>
        <p style="color: #6b7280; font-size: 13px;">このリンクは1時間有効です。</p>
        <p style="color: #6b7280; font-size: 13px;">パスワード再設定をリクエストしていない場合は無視してください。</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">人脈マップ</p>
      </div>
    `,
  });
}
