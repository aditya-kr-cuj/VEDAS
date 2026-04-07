import { query } from '../db/client.js';
import { sendEmail } from '../utils/email.js';
import { buildLowAttendanceEmail } from '../utils/email-templates.js';

const THRESHOLD = Number(process.env.ATTENDANCE_THRESHOLD ?? 75);

async function main() {
  const tenants = await query<{ id: string; name: string; owner_email: string }>(
    `SELECT id, name, owner_email FROM tenants WHERE is_active = TRUE`
  );

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = today.toISOString().slice(0, 10);

  for (const tenant of tenants) {
    const students = await query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM students WHERE tenant_id = $1`,
      [tenant.id]
    );

    for (const student of students) {
      const [user] = await query<{ full_name: string; email: string }>(
        `SELECT full_name, email FROM users WHERE id = $1`,
        [student.user_id]
      );
      if (!user) continue;

      const totalRows = await query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM attendance_records
          WHERE tenant_id = $1 AND student_id = $2 AND date BETWEEN $3 AND $4
        `,
        [tenant.id, student.id, startDate, endDate]
      );

      const presentRows = await query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM attendance_records
          WHERE tenant_id = $1 AND student_id = $2 AND date BETWEEN $3 AND $4
            AND status IN ('present','late','excused')
        `,
        [tenant.id, student.id, startDate, endDate]
      );

      const total = Number(totalRows[0]?.count ?? 0);
      if (total === 0) continue;
      const present = Number(presentRows[0]?.count ?? 0);
      const percentage = Math.round((present / total) * 100);

      if (percentage < THRESHOLD) {
        const template = buildLowAttendanceEmail({
          fullName: user.full_name,
          percentage,
          instituteName: tenant.name
        });

        await sendEmail({ to: user.email, subject: template.subject, body: template.html });
        await sendEmail({ to: tenant.owner_email, subject: template.subject, body: template.html });
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
