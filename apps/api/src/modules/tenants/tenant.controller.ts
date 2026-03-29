import type { Request, Response } from 'express';
import { findTenantById, updateTenantProfile } from './tenant.repository.js';
import { HttpError } from '../../utils/http-error.js';

export async function getMyTenantHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is missing');
  }

  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new HttpError(404, 'Tenant not found');
  }

  res.status(200).json({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    ownerEmail: tenant.owner_email,
    phone: tenant.phone,
    subdomain: tenant.subdomain,
    customDomain: tenant.custom_domain,
    planKey: tenant.plan_key,
    addressLine1: tenant.address_line1,
    addressLine2: tenant.address_line2,
    city: tenant.city,
    state: tenant.state,
    pincode: tenant.pincode,
    kycIdNumber: tenant.kyc_id_number,
    kycDocumentUrl: tenant.kyc_document_url,
    isActive: tenant.is_active,
    createdAt: tenant.created_at
  });
}

export async function updateMyTenantHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is missing');
  }

  await updateTenantProfile({ tenantId, ...req.body });
  res.status(200).json({ message: 'Institute profile updated' });
}
