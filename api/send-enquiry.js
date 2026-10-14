const nodemailer = require('nodemailer');

// Email destination per service. The two confirmed by the client are hardcoded;
// everything is still overridable via env vars without a code change.
const DESTINATIONS = {
  'Student Visa Consultancy': process.env.MAIL_TO_STUDENT_VISA || 'itechsole@gmail.com',
  'Recruitment Services': process.env.MAIL_TO_RECRUITMENT || 'sxopehit.services@gmail.com',
  'Immigration Services': process.env.MAIL_TO_IMMIGRATION || 'support@sxopehit.com',
  'Investment & Citizenship': process.env.MAIL_TO_INVESTMENT || 'support@sxopehit.com'
};
const DEFAULT_DESTINATION = process.env.MAIL_TO_DEFAULT || 'support@sxopehit.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Loose international phone check: digits, spaces, +, -, () — at least 7 digits total.
const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;

function titleCase(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmail({ service, country, name, email, phone, date, message, fields }) {
  const rows = [
    ['Service', service],
    ['Country', country],
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Preferred Date', date]
  ];

  if (fields && typeof fields === 'object') {
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value === undefined || value === null || String(value).trim() === '') return;
      rows.push([titleCase(key), value]);
    });
  }

  rows.push(['Message', message || '(none provided)']);

  const textBody = rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

  const htmlRows = rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5b6b8c;font-weight:600;white-space:nowrap;vertical-align:top;">${escapeHtml(
          label
        )}</td><td style="padding:6px 0;color:#0b1b3a;">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');

  const htmlBody = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;">${htmlRows}</table>`;

  return { textBody, htmlBody };
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 465,
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : true,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid request body.' });
    }
  }

  const { service, country, name, email, phone, date, message, fields, website } = body || {};

  // Honeypot: real users never fill this hidden field. Pretend success, send nothing.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  const missing = [];
  if (!service || !String(service).trim()) missing.push('service');
  if (!name || !String(name).trim()) missing.push('name');
  if (!email || !EMAIL_RE.test(String(email).trim())) missing.push('email');
  if (!phone || !PHONE_RE.test(String(phone).trim())) missing.push('phone');

  if (missing.length) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid fields.', fields: missing });
  }

  const destination = DESTINATIONS[service] || DEFAULT_DESTINATION;
  const subject = `New ${service} Enquiry${country ? ' — ' + country : ''}`;
  const { textBody, htmlBody } = buildEmail({ service, country, name, email, phone, date, message, fields });

  const transporter = getTransporter();
  if (!transporter) {
    console.error('send-enquiry: SMTP is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS env vars).');
    return res.status(500).json({
      ok: false,
      error: 'Email sending is not configured yet. Please call us directly at +92 3200557 755.'
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: destination,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-enquiry: failed to send email:', err);
    return res.status(500).json({
      ok: false,
      error: 'We could not send your enquiry right now. Please try again or call us at +92 3200557 755.'
    });
  }
};
