import { query } from '../db/client.js';
import { sendEmail } from '../utils/email.js';
import { buildFeeReminderEmail } from '../utils/email-templates.js';

type ReminderType = 'before' | 'due' | 'overdue';

const reminderWindows: Array<{ type: ReminderType; offsetDays: number; label: string }> = [
  { type: 'before', offsetDays: 7, label: 'upcoming' },
  { type: 'due', offsetDays: 0, label: 'due date' },
  { type: 'overdue', offsetDays: -3, label: 'overdue' }
];

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

async function sendReminderEmail(payload: {
  studentName: string;
  studentEmail: string | null;
  instituteName: string;
  dueAmount: number;
  dueDate: string;
  label: string;
  adminEmail: string | null;
}) {
  const email = buildFeeReminderEmail({
    fullName: payload.studentName,
    instituteName: payload.instituteName,
    dueAmount: payload.dueAmount,
    dueDate: payload.dueDate,
    statusLabel: payload.label
  });

  if (payload.studentEmail) {
    await sendEmail({ to: payload.studentEmail, subject: email.subject, body: email.html });
  }

  if (payload.adminEmail) {
    const adminBody = buildFeeReminderEmail({
      fullName: 'Institute Admin',
      instituteName: payload.instituteName,
      dueAmount: payload.dueAmount,
      dueDate: payload.dueDate,
      statusLabel: `student ${payload.studentName} is ${payload.label}`
    });
    await sendEmail({ to: payload.adminEmail, subject: adminBody.subject, body: adminBody.html });
  }

  if (!payload.studentEmail && !payload.adminEmail) {
    console.warn('[FeeReminders] No email recipients for reminder', payload.studentName);
  }
}

async function run() {
  for (const window of reminderWindows) {
    const rows = await query<{
      tenant_id: string;
      student_id: string;
      student_name: string;
      student_email: string | null;
      institute_name: string;
      institute_email: string | null;
      due_amount: string;
      due_date: string;
    }>(
      `
        SELECT
          sf.tenant_id,
          sf.student_id,
          u.full_name AS student_name,
          u.email AS student_email,
          t.name AS institute_name,
          t.owner_email AS institute_email,
          sf.due_amount,
          sf.due_date
        FROM student_fees sf
        JOIN students s ON s.id = sf.student_id
        JOIN users u ON u.id = s.user_id
        JOIN tenants t ON t.id = sf.tenant_id
        WHERE sf.due_amount > 0
          AND sf.due_date = CURRENT_DATE + $1::int
      `,
      [window.offsetDays]
    );

    for (const row of rows) {
      await sendReminderEmail({
        studentName: row.student_name,
        studentEmail: row.student_email,
        instituteName: row.institute_name,
        dueAmount: Number(row.due_amount),
        dueDate: formatDate(row.due_date),
        label: window.label,
        adminEmail: row.institute_email
      });
    }
  }
}

run()
  .then(() => {
    console.log('[FeeReminders] Completed fee reminder run.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[FeeReminders] Failed to run fee reminders.', error);
    process.exit(1);
  });
