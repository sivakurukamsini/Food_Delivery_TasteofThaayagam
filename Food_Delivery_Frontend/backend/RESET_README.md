Testing password reset (dev & production)

This project supports password reset emails using either a real SMTP server (production) or Ethereal (development).

1) Dev (Ethereal - built-in fallback)
- No configuration required. When you trigger a password reset, the server will create an Ethereal inbox and send the reset email. The server response will include a `previewUrl` (only for Ethereal) which you can open in a browser to view the message and copy the reset code.

2) Production (Real SMTP like Gmail)
- Create an app password in your Gmail account (recommended) and enable "Less secure apps" or use an app-specific password for accounts with two-factor authentication.
- Add the following environment variables to your `backend/.env` (or hosting provider config):
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your@gmail.com
  SMTP_PASS=your_app_password
  FROM_EMAIL=your@gmail.com
  APP_URL=https://your-frontend-url
  JWT_SECRET=your_jwt_secret

- Restart the backend after setting these env vars.

3) How the inline flow works in the frontend (Login popup)
- Click "Forgot password?" in the Login popup.
- Enter your email and click "Send code".
- If using Ethereal, the response will include a `previewUrl` toast that you can open to see the code. If using Gmail, the code will arrive in the real inbox.
- Enter the reset code (token) and the new password in the popup and click "Set new password".

4) Troubleshooting
- If you don't receive the email, check spam/junk.
- For Gmail, ensure SMTP credentials are correct and the app password is used.
- Check backend console logs for either the Ethereal preview URL or SMTP errors.

If you want me to add a debug UI that shows the preview URL directly inside the popup (instead of a toast) I can add that next.