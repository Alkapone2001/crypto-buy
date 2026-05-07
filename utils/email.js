const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const hasPlaceholderCreds = emailUser.includes('your_') || emailPass.includes('your_');

  if (!emailUser || !emailPass || hasPlaceholderCreds) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"CryptoExchange" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (e) {
    console.error(`[EMAIL ERROR] ${e.message}`);
  }
}

function orderRow(label, value) {
  return `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;">${label}</td><td style="padding:8px 12px;font-weight:600;font-size:14px;">${value}</td></tr>`;
}

function emailWrapper(content) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;">₿ CryptoExchange</h1>
    </div>
    <div style="padding:32px;">${content}</div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
      © 2025 CryptoExchange · This is an automated message
    </div>
  </div></body></html>`;
}

// Email sent to admin when a new order is placed
async function notifyAdminNewOrder({ adminEmail, order, userName, userEmail }) {
  const subject = `New ${order.type.toUpperCase()} Order — ${order.crypto_amount} ${order.crypto} (${order.network})`;
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;">New Order Received</h2>
    <p style="color:#64748b;margin:0 0 24px;">A customer just placed a new order.</p>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
      ${orderRow('Order ID', `#${order.id.slice(0,8).toUpperCase()}`)}
      ${orderRow('Type', order.type.toUpperCase())}
      ${orderRow('Asset', `${order.crypto_amount} ${order.crypto}`)}
      ${orderRow('Network', order.network)}
      ${orderRow('USD Value', `$${parseFloat(order.fiat_amount).toFixed(2)}`)}
      ${orderRow('Customer', `${userName} (${userEmail})`)}
      ${order.wallet_address ? orderRow('Wallet', order.wallet_address) : ''}
    </table>
    <div style="margin-top:24px;padding:14px 16px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1d4ed8;">
      Log in to the admin panel to process this order.
    </div>
  `);
  await sendEmail({ to: adminEmail, subject, html });
}

// Email sent to user when their order is confirmed (order placed)
async function notifyUserOrderCreated({ userEmail, userName, order, paymentDetails }) {
  const isBuy = order.type === 'buy';
  const subject = isBuy
    ? `Order Confirmed — Buy ${order.crypto_amount} ${order.crypto}`
    : `Order Confirmed — Sell ${order.crypto_amount} ${order.crypto}`;

  const paymentSection = isBuy && paymentDetails ? `
    <h3 style="color:#0f172a;margin:24px 0 12px;">Payment Instructions</h3>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
      ${orderRow('Bank Name', paymentDetails.bank_name || '—')}
      ${orderRow('Account Number', paymentDetails.bank_account || '—')}
      ${orderRow('Account Holder', paymentDetails.bank_holder || '—')}
      ${orderRow('Amount to Pay', `$${parseFloat(order.fiat_amount).toFixed(2)} USD`)}
      ${orderRow('Reference', `ORDER-${order.id.slice(0,8).toUpperCase()}`)}
    </table>
    <div style="margin-top:16px;padding:14px 16px;background:#fff7ed;border-radius:8px;font-size:13px;color:#c2410c;">
      ⚠️ Use the Order ID as your payment reference so we can identify your transfer.
    </div>
  ` : '';

  const depositSection = !isBuy ? `
    <h3 style="color:#0f172a;margin:24px 0 12px;">Send Your Crypto</h3>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
      ${orderRow('Deposit Address', order.deposit_address || '—')}
      ${orderRow('Network', order.network)}
      ${orderRow('Amount to Send', `${order.crypto_amount} ${order.crypto}`)}
      ${orderRow('You Will Receive', `$${parseFloat(order.fiat_amount).toFixed(2)} USD`)}
    </table>
  ` : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;">Order Confirmed ✅</h2>
    <p style="color:#64748b;margin:0 0 24px;">Hi ${userName}, your order has been created successfully.</p>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
      ${orderRow('Order ID', `#${order.id.slice(0,8).toUpperCase()}`)}
      ${orderRow('Type', order.type.toUpperCase())}
      ${orderRow('Amount', `${order.crypto_amount} ${order.crypto} (${order.network})`)}
      ${orderRow('USD Value', `$${parseFloat(order.fiat_amount).toFixed(2)}`)}
    </table>
    ${paymentSection}
    ${depositSection}
  `);
  await sendEmail({ to: userEmail, subject, html });
}

// Email sent to user when admin marks their order as completed
async function notifyUserOrderCompleted({ userEmail, userName, order }) {
  const isBuy = order.type === 'buy';
  const subject = `Your ${isBuy ? 'Crypto Has Been Sent' : 'Payment Has Been Sent'} — Order #${order.id.slice(0,8).toUpperCase()}`;
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;">${isBuy ? '🎉 Crypto Delivered!' : '💸 Payment Sent!'}</h2>
    <p style="color:#64748b;margin:0 0 24px;">Hi ${userName}, your order has been completed.</p>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
      ${orderRow('Order ID', `#${order.id.slice(0,8).toUpperCase()}`)}
      ${orderRow('Type', order.type.toUpperCase())}
      ${orderRow('Amount', `${order.crypto_amount} ${order.crypto} (${order.network})`)}
      ${orderRow('Value', `$${parseFloat(order.fiat_amount).toFixed(2)} USD`)}
      ${isBuy && order.wallet_address ? orderRow('Sent to Wallet', order.wallet_address) : ''}
    </table>
    <div style="margin-top:24px;padding:14px 16px;background:#dcfce7;border-radius:8px;font-size:13px;color:#15803d;">
      ✅ ${isBuy ? `Your ${order.crypto} has been sent to your wallet on the ${order.network} network.` : 'Your USD payment has been processed and sent to your bank account.'}
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:20px;">Thank you for trading with CryptoExchange!</p>
  `);
  await sendEmail({ to: userEmail, subject, html });
}

module.exports = { sendEmail, notifyAdminNewOrder, notifyUserOrderCreated, notifyUserOrderCompleted };
