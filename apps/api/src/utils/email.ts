export async function sendEmail(payload: { to: string; subject: string; body: string }): Promise<void> {
  // Phase 1: basic email notification stub (logs only).
  // Replace with real provider in Phase 2 (SendGrid/SES).
  console.log('[Email]', payload.to, payload.subject);
}
