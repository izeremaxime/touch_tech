import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD,
      },
      // Some local Windows setups (antivirus/network TLS inspection) break certificate
      // verification for outbound SMTP. Opt-in only — never enable this in production.
      tls: process.env.SMTP_INSECURE_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return transporter;
}

export async function sendNewProductAnnouncement(emails, product) {
  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    console.warn(`[mailer] SMTP not configured — skipping new product announcement for "${product.name}"`);
    return;
  }
  if (emails.length === 0) return;

  const productUrl = `${process.env.APP_URL || 'http://localhost:3000'}/product.html?id=${product.id}`;

  await getTransporter().sendMail({
    from: `"Touch Techhub" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    bcc: emails,
    subject: `New arrival: ${product.name}`,
    text: `We just added a new product to Touch Techhub!\n\n${product.name}\n${productUrl}\n\nCheck it out before it's gone.`,
    html: `
      <p>We just added a new product to Touch Techhub!</p>
      <p><strong>${product.name}</strong></p>
      <p><a href="${productUrl}">View it in the shop</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    console.warn(`[mailer] SMTP not configured — reset link for ${toEmail}: ${resetUrl}`);
    return;
  }

  await getTransporter().sendMail({
    from: `"Touch Techhub" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset your Touch Techhub password',
    text: `We received a request to reset your Touch Techhub password.\n\nReset it here (valid for 30 minutes): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <p>We received a request to reset your Touch Techhub password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a> (link valid for 30 minutes).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
