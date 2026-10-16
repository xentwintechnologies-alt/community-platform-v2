const clientUrl = () =>
  String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// Accepts EMAIL_FROM as plain "me@gmail.com" or "Name <me@gmail.com>"
function getSender() {
  const raw = String(process.env.EMAIL_FROM || "").trim();
  const match = raw.match(/^(.*)<(.+)>$/);

  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || "Community Platform",
      email: match[2].trim(),
    };
  }

  return {
    name: process.env.EMAIL_FROM_NAME || "Community Platform",
    email: raw,
  };
}

async function deliver({ to, subject, text, html, link }) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = getSender();

  if (!apiKey || !sender.email) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email is not configured: BREVO_API_KEY or EMAIL_FROM is missing"
      );
    }

    console.log(
      `\n[DEV EMAIL - Brevo not configured]\nTo: ${to}\nSubject: ${subject}\nLink: ${link}\n`
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        result.message || result.code || `HTTP ${response.status}`;
      console.error("[EMAIL FAILED]", response.status, message);
      throw new Error(`Brevo email failed: ${message}`);
    }

    console.log(`[EMAIL SENT] to=${to} id=${result.messageId}`);
  } catch (err) {
    console.error("[EMAIL FAILED]", err.message);

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[DEV FALLBACK] Use this link to continue testing:\n${link}\n`);
    }

    throw err;
  }
}

function layout(title, intro, buttonLabel, link, footer) {
  return `<!doctype html><html><body style="margin:0;background:#f2f5fb;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f2;">
    <div style="background:#0b1b33;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700;">Community Platform</div>
    <div style="padding:28px;">
      <h2 style="margin:0 0 12px;color:#0b1b33;font-size:20px;">${title}</h2>
      <p style="color:#44506a;font-size:14px;line-height:1.6;margin:0 0 22px;">${intro}</p>
      <a href="${link}" style="display:inline-block;background:#1fb6e8;color:#04202e;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;font-size:14px;">${buttonLabel}</a>
      <p style="color:#7a859c;font-size:12px;line-height:1.6;margin:22px 0 0;">If the button does not work, copy this link into your browser:<br><span style="word-break:break-all;">${link}</span></p>
      <p style="color:#7a859c;font-size:12px;line-height:1.6;margin:14px 0 0;">${footer}</p>
      <p style="color:#7a859c;font-size:12px;line-height:1.6;margin:14px 0 0;">Can't find this email? Check your Spam folder.</p>
    </div>
  </div></body></html>`;
}

async function sendVerificationEmail(to, name, token) {
  const link = `${clientUrl()}/set-password?mode=verify&token=${encodeURIComponent(token)}`;

  await deliver({
    to,
    link,
    subject: "Verify your email - Community Platform",
    text: `Hi ${name},

Welcome! Confirm your email and create your password here:
${link}

This link is valid for 24 hours. If you did not sign up, ignore this email.`,
    html: layout(
      `Welcome, ${esc(name)}!`,
      "Please confirm your email address and create your password to activate your account.",
      "Verify email &amp; create password",
      link,
      "This link is valid for 24 hours. If you did not sign up, you can safely ignore this email."
    ),
  });
}

async function sendResetEmail(to, name, token) {
  const link = `${clientUrl()}/set-password?mode=reset&token=${encodeURIComponent(token)}`;

  await deliver({
    to,
    link,
    subject: "Reset your password - Community Platform",
    text: `Hi ${name},

Use this link to set a new password:
${link}

This link is valid for 1 hour. If you did not ask for this, ignore this email. Your password stays the same.`,
    html: layout(
      "Reset your password",
      `Hi ${esc(name)}, click the button below to choose a new password.`,
      "Reset password",
      link,
      "This link is valid for 1 hour. If you did not request it, ignore this email and your password will stay the same."
    ),
  });
}

module.exports = { sendVerificationEmail, sendResetEmail };