import { query } from '../../db/client.js';

/* ─── Types ──────────────────────────────────────── */

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  tenant_code: string;
  owner_email: string;
  plan_key: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_active: boolean;
  created_at: Date;
  user_count: string;
  student_count: string;
  teacher_count: string;
}

export interface DashboardStats {
  total_institutes: string;
  active_institutes: string;
  pending_institutes: string;
  total_users: string;
  total_students: string;
  total_revenue: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  tenant_code: string;
  owner_email: string;
  phone: string | null;
  plan_key: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  user_count: string;
  student_count: string;
  teacher_count: string;
  course_count: string;
  batch_count: string;
}

export interface SignupDataPoint {
  month: string;
  count: string;
}

export interface RevenueByPlan {
  plan_key: string;
  institute_count: string;
  monthly_revenue: string;
}

/* ─── Dashboard ──────────────────────────────────── */

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await query<DashboardStats>(
    `
      SELECT
        (SELECT COUNT(*)::text FROM tenants) AS total_institutes,
        (SELECT COUNT(*)::text FROM tenants WHERE status = 'active') AS active_institutes,
        (SELECT COUNT(*)::text FROM tenants WHERE status = 'pending') AS pending_institutes,
        (SELECT COUNT(*)::text FROM users WHERE role != 'super_admin') AS total_users,
        (SELECT COUNT(*)::text FROM users WHERE role = 'student') AS total_students,
        COALESCE(
          (SELECT SUM(sp.price_inr_monthly)::text
           FROM tenants t
           JOIN subscription_plans sp ON sp.plan_key = t.plan_key
           WHERE t.status = 'active'),
          '0'
        ) AS total_revenue
    `
  );
  return rows[0];
}

export async function getRecentRegistrations(limit = 10): Promise<TenantSummary[]> {
  return query<TenantSummary>(
    `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.tenant_code,
        t.owner_email,
        t.plan_key,
        t.status,
        t.is_active,
        t.created_at,
        COUNT(u.id) FILTER (WHERE u.role != 'super_admin')::text AS user_count,
        COUNT(u.id) FILTER (WHERE u.role = 'student')::text AS student_count,
        COUNT(u.id) FILTER (WHERE u.role = 'teacher')::text AS teacher_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $1
    `,
    [limit]
  );
}

/* ─── Institute List ─────────────────────────────── */

export async function listInstitutes(filters: {
  status?: string;
  plan?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ institutes: TenantSummary[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`t.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.plan) {
    conditions.push(`t.plan_key = $${idx}`);
    params.push(filters.plan);
    idx++;
  }

  if (filters.search) {
    conditions.push(`(t.name ILIKE $${idx} OR t.owner_email ILIKE $${idx} OR t.tenant_code ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 20;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const countResult = await query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM tenants t ${where}`, params);
  const total = parseInt(countResult[0].total, 10);

  const institutes = await query<TenantSummary>(
    `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.tenant_code,
        t.owner_email,
        t.plan_key,
        t.status,
        t.is_active,
        t.created_at,
        COUNT(u.id) FILTER (WHERE u.role != 'super_admin')::text AS user_count,
        COUNT(u.id) FILTER (WHERE u.role = 'student')::text AS student_count,
        COUNT(u.id) FILTER (WHERE u.role = 'teacher')::text AS teacher_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      ${where}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...params, limit, offset]
  );

  return { institutes, total };
}

/* ─── Institute Detail ───────────────────────────── */

export async function getInstituteDetail(id: string): Promise<TenantDetail | null> {
  const rows = await query<TenantDetail>(
    `
      SELECT
        t.*,
        COUNT(u.id) FILTER (WHERE u.role != 'super_admin')::text AS user_count,
        COUNT(u.id) FILTER (WHERE u.role = 'student')::text AS student_count,
        COUNT(u.id) FILTER (WHERE u.role = 'teacher')::text AS teacher_count,
        (SELECT COUNT(*)::text FROM courses WHERE tenant_id = t.id) AS course_count,
        (SELECT COUNT(*)::text FROM batches WHERE tenant_id = t.id) AS batch_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `,
    [id]
  );
  return rows[0] ?? null;
}

/* ─── Institute Mutations ────────────────────────── */

export async function updateInstituteStatus(
  id: string,
  status: 'pending' | 'active' | 'suspended' | 'rejected'
): Promise<void> {
  const isActive = status === 'active';
  await query(
    `UPDATE tenants SET status = $1, is_active = $2, updated_at = NOW() WHERE id = $3`,
    [status, isActive, id]
  );
}

export async function updateInstituteDetails(
  id: string,
  data: {
    name?: string;
    plan_key?: string;
    phone?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }
): Promise<void> {
  await query(
    `
      UPDATE tenants
      SET
        name = COALESCE($1, name),
        plan_key = COALESCE($2, plan_key),
        phone = COALESCE($3, phone),
        address_line1 = COALESCE($4, address_line1),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        pincode = COALESCE($7, pincode),
        updated_at = NOW()
      WHERE id = $8
    `,
    [data.name, data.plan_key, data.phone, data.address_line1, data.city, data.state, data.pincode, id]
  );
}

export async function deleteInstitute(id: string): Promise<void> {
  await query(`DELETE FROM tenants WHERE id = $1`, [id]);
}

/* ─── Analytics ──────────────────────────────────── */

export async function getSignupTimeseries(): Promise<SignupDataPoint[]> {
  return query<SignupDataPoint>(
    `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::text AS count
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `
  );
}

export async function getRevenueByPlan(): Promise<RevenueByPlan[]> {
  return query<RevenueByPlan>(
    `
      SELECT
        COALESCE(t.plan_key, 'none') AS plan_key,
        COUNT(t.id)::text AS institute_count,
        COALESCE(SUM(sp.price_inr_monthly), 0)::text AS monthly_revenue
      FROM tenants t
      LEFT JOIN subscription_plans sp ON sp.plan_key = t.plan_key
      WHERE t.status = 'active'
      GROUP BY t.plan_key
      ORDER BY monthly_revenue DESC
    `
  );
}

/* ─── Legacy export (keep backwards compat) ──────── */

export async function listTenantSummaries(): Promise<TenantSummary[]> {
  return getRecentRegistrations(100);
}
