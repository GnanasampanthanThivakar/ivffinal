import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("EMAIL_SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "587"))
SMTP_USER = os.getenv("EMAIL_SMTP_USER", "")
SMTP_PASS = os.getenv("EMAIL_SMTP_PASS", "")
FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Momera")


def send_otp_email(to_email: str, otp: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        print("[email] SMTP not configured — EMAIL_SMTP_USER / EMAIL_SMTP_PASS missing")
        return False

    subject = "Your Momera Email Change Code"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f7f9;border-radius:16px;">
      <h2 style="color:#0F9F8F;margin-bottom:8px;">Email Change Verification</h2>
      <p style="color:#374151;font-size:15px;">Use the code below to confirm your new email address.</p>
      <div style="background:#ffffff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #e5e7eb;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0F9F8F;">{otp}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:13px;">If you did not request this, ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        print(f"[email] OTP sent to {to_email}")
        return True
    except Exception as e:
        print(f"[email] send failed: {e}")
        return False
