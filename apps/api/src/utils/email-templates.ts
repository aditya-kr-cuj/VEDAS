import { env } from '../config/env.js';

function layout(title: string, content: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:24px 28px; background:#0f1b1f; color:#ffffff; font-weight:700; letter-spacing:1px;">
                    VEDAS
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px; color:#1f2a2e; font-size:15px; line-height:1.6;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px; font-size:12px; color:#6b7b83; background:#f7f9fa;">
                    If you did not request this, you can safely ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildVerificationEmail(payload: { fullName: string; token: string }) {
  const verifyUrl = `${env.APP_BASE_URL}/verify-email?token=${encodeURIComponent(payload.token)}`;
  const content = `
    <p style="margin:0 0 12px;">Hi ${payload.fullName},</p>
    <p style="margin:0 0 16px;">
      Welcome to VEDAS! Please verify your email address to activate your institute account.
    </p>
    <p style="margin:0 0 16px;">
      <a href="${verifyUrl}" style="display:inline-block; padding:12px 18px; background:#f4b860; color:#1a1a1a; text-decoration:none; border-radius:8px; font-weight:700;">
        Verify Email
      </a>
    </p>
    <p style="margin:0 0 8px; color:#5a6a72;">Or use this token:</p>
    <p style="margin:0; font-family:monospace; font-size:14px; background:#f0f3f5; padding:10px 12px; border-radius:8px;">
      ${payload.token}
    </p>
  `;

  return {
    subject: 'Verify your VEDAS email',
    html: layout('Verify your email', content)
  };
}

export function buildPasswordResetEmail(payload: { fullName: string; token: string }) {
  const content = `
    <p style="margin:0 0 12px;">Hi ${payload.fullName},</p>
    <p style="margin:0 0 16px;">
      We received a request to reset your VEDAS password. Use the token below to proceed.
    </p>
    <p style="margin:0; font-family:monospace; font-size:14px; background:#f0f3f5; padding:10px 12px; border-radius:8px;">
      ${payload.token}
    </p>
  `;

  return {
    subject: 'Reset your VEDAS password',
    html: layout('Reset password', content)
  };
}

export function buildWelcomeEmail(payload: { fullName: string; instituteName: string }) {
  const content = `
    <p style="margin:0 0 12px;">Hi ${payload.fullName},</p>
    <p style="margin:0 0 16px;">
      Your institute <strong>${payload.instituteName}</strong> is now set up on VEDAS.
    </p>
    <p style="margin:0 0 16px;">
      You can start adding students, teachers, courses, and batches right away.
    </p>
  `;

  return {
    subject: 'Welcome to VEDAS',
    html: layout('Welcome to VEDAS', content)
  };
}

export function buildLowAttendanceEmail(payload: {
  fullName: string;
  percentage: number;
  instituteName: string;
}) {
  const content = `
    <p style="margin:0 0 12px;">Hi ${payload.fullName},</p>
    <p style="margin:0 0 16px;">
      Your attendance has fallen to <strong>${payload.percentage}%</strong> this week at ${payload.instituteName}.
    </p>
    <p style="margin:0 0 16px;">
      Please reach out to your institute admin if you need support.
    </p>
  `;

  return {
    subject: 'Attendance alert',
    html: layout('Attendance alert', content)
  };
}

export function buildFeeReminderEmail(payload: {
  fullName: string;
  instituteName: string;
  dueAmount: number;
  dueDate: string;
  statusLabel: string;
}) {
  const content = `
    <p style="margin:0 0 12px;">Hi ${payload.fullName},</p>
    <p style="margin:0 0 16px;">
      This is a ${payload.statusLabel} reminder for your pending fee at ${payload.instituteName}.
    </p>
    <p style="margin:0 0 16px;">
      Due Amount: <strong>${payload.dueAmount}</strong><br/>
      Due Date: <strong>${payload.dueDate}</strong>
    </p>
    <p style="margin:0 0 16px;">
      Please complete the payment at the earliest to avoid late fees.
    </p>
  `;

  return {
    subject: 'Fee payment reminder',
    html: layout('Fee reminder', content)
  };
}
