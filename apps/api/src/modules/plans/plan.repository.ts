import { query } from '../../db/client.js';

interface PlanRecord {
  id: string;
  plan_key: string;
  name: string;
  price_inr_monthly: number;
  is_active: boolean;
}

export async function listActivePlans(): Promise<PlanRecord[]> {
  return query<PlanRecord>(
    `
      SELECT id, plan_key, name, price_inr_monthly, is_active
      FROM subscription_plans
      WHERE is_active = TRUE
      ORDER BY price_inr_monthly ASC
    `
  );
}
