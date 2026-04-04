import type { PoolClient } from 'pg';

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  phone: string | null;
  plan_key: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  kyc_id_number: string | null;
  kyc_document_url: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createTenant(
  client: PoolClient,
  payload: {
    name: string;
    slug: string;
    ownerEmail: string;
    phone?: string;
    planKey?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    kycIdNumber?: string;
    kycDocumentUrl?: string;
    subdomain?: string;
    customDomain?: string;
  }
): Promise<TenantRecord> {
  const result = await client.query<TenantRecord>(
    `
      INSERT INTO tenants (
        name,
        slug,
        owner_email,
        phone,
        plan_key,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        kyc_id_number,
        kyc_document_url,
        subdomain,
        custom_domain
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
    [
      payload.name,
      payload.slug,
      payload.ownerEmail.toLowerCase(),
      payload.phone ?? null,
      payload.planKey ?? null,
      payload.addressLine1 ?? null,
      payload.addressLine2 ?? null,
      payload.city ?? null,
      payload.state ?? null,
      payload.pincode ?? null,
      payload.kycIdNumber ?? null,
      payload.kycDocumentUrl ?? null,
      payload.subdomain ?? null,
      payload.customDomain ?? null
    ]
  );

  return result.rows[0];
}

export async function findTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const { query } = await import('../../db/client.js');
  const rows = await query<TenantRecord>('SELECT * FROM tenants WHERE slug = $1 LIMIT 1', [slug]);
  return rows[0] ?? null;
}

export async function findTenantById(id: string): Promise<TenantRecord | null> {
  const { query } = await import('../../db/client.js');
  const rows = await query<TenantRecord>('SELECT * FROM tenants WHERE id = $1 LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function updateTenantProfile(payload: {
  tenantId: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  kycIdNumber?: string;
  kycDocumentUrl?: string;
  customDomain?: string;
  planKey?: string;
}): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query(
    `
      UPDATE tenants
      SET
        address_line1 = COALESCE($1, address_line1),
        address_line2 = COALESCE($2, address_line2),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        pincode = COALESCE($5, pincode),
        kyc_id_number = COALESCE($6, kyc_id_number),
        kyc_document_url = COALESCE($7, kyc_document_url),
        custom_domain = COALESCE($8, custom_domain),
        plan_key = COALESCE($9, plan_key),
        updated_at = NOW()
      WHERE id = $10
    `,
    [
      payload.addressLine1 ?? null,
      payload.addressLine2 ?? null,
      payload.city ?? null,
      payload.state ?? null,
      payload.pincode ?? null,
      payload.kycIdNumber ?? null,
      payload.kycDocumentUrl ?? null,
      payload.customDomain ?? null,
      payload.planKey ?? null,
      payload.tenantId
    ]
  );
}
