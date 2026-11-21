export function resetPasswordEmailTemplate({ resetUrl }) {
  const url = new URL(resetUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error("InvalidResetUrl");
  const safeUrl = url.href.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Your Password - Mentor Token</title></head>
<body style="margin:0;padding:0;background-color:#f4f4fb;font-family:Arial,Helvetica,sans-serif;color:#566a7f;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Mentor Token password reset link expires in 15 minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4fb;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e6e7f0;border-radius:18px;overflow:hidden;">
        <tr><td align="center" bgcolor="#696cff" style="padding:34px 24px;border-radius:17px 17px 0 0;">
          <p style="margin:0;color:#ffffff;font-size:28px;line-height:36px;font-weight:bold;letter-spacing:-1px;">Mentor Token</p>
          <p style="margin:8px 0 0;color:#eeedff;font-size:13px;line-height:20px;">Grow your startup. Unlock your potential.</p>
        </td></tr>
        <tr><td style="padding:36px 28px 32px;">
          <h1 style="margin:0 0 20px;color:#566a7f;font-size:28px;line-height:36px;font-weight:600;">Reset Your Password</h1>
          <p style="margin:0 0 24px;color:#657a91;font-size:16px;line-height:26px;">Hello,<br>We received a request to reset your Mentor Token password. Use the button below to create a new one.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#696cff" style="border-radius:8px;">
              <a href="${safeUrl}" style="display:inline-block;padding:17px 36px;border:1px solid #696cff;border-radius:8px;color:#ffffff;font-size:16px;line-height:24px;font-weight:bold;text-decoration:none;">Reset Password</a>
            </td></tr></table>
          </td></tr></table>
          <p style="margin:26px 0 16px;color:#657a91;font-size:14px;line-height:24px;">This link expires in <strong>15 minutes</strong> and can only be used once.</p>
          <p style="margin:0 0 26px;color:#657a91;font-size:14px;line-height:24px;">If you didn’t request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-top:1px solid #ececf6;padding-top:24px;">
            <p style="margin:0 0 10px;color:#8592a3;font-size:13px;line-height:22px;">Button not working? Copy and paste this link into your browser:</p>
            <p style="margin:0;font-size:13px;line-height:22px;word-break:break-all;overflow-wrap:anywhere;"><a href="${safeUrl}" style="color:#696cff;text-decoration:underline;word-break:break-all;">${safeUrl}</a></p>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding:22px 24px;background-color:#fafaff;border-top:1px solid #ececf6;border-radius:0 0 17px 17px;">
          <p style="margin:0;color:#696cff;font-size:15px;line-height:24px;font-weight:bold;">Mentor Token</p>
          <p style="margin:5px 0 0;color:#8592a3;font-size:12px;line-height:20px;">&copy; ${new Date().getFullYear()} Mentor Token. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
export function welcomeEmailTemplate({ name }) {
  const safeName = String(name || "корисник")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  return `
    <!DOCTYPE html>
    <html lang="mk">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body style="font-family: Arial, sans-serif; background: #f7f6fa; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px;">
          <h2 style="color: #7357d8;">Добредојде во MentorToken!</h2>

          <p>Здраво ${safeName},</p>

          <p>Твојата регистрација е успешна.</p>

          <p>Ти благодариме што се приклучи на MentorToken.</p>

          <p>Со почит,<br />MentorToken Team</p>
        </div>
      </body>
    </html>
  `;
}