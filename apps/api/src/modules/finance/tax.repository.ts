import { query } from '../../db/client.js';

type TaxRegime = 'gst' | 'vat' | 'none';

export type TaxSettingsRecord = {
  id: string;
  tenant_id: string;
  gst_number: string | null;
  tax_rate: string;
  tax_regime: TaxRegime;
  financial_year_start_month: number;
  created_at: string;
  updated_at: string;
};

export async function getTaxSettings(tenantId: string) {
  const rows = await query<TaxSettingsRecord>(
    `SELECT * FROM tax_settings WHERE tenant_id = $1 LIMIT 1`,
    [tenantId]
  );
  if (!rows[0]) {
    return {
      gst_number: null as string | null,
      tax_rate: 0,
      tax_regime: 'none' as TaxRegime,
      financial_year_start_month: 4
    };
  }

  return {
    id: rows[0].id,
    gst_number: rows[0].gst_number,
    tax_rate: Number(rows[0].tax_rate),
    tax_regime: rows[0].tax_regime,
    financial_year_start_month: rows[0].financial_year_start_month,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at
  };
}

export async function upsertTaxSettings(params: {
  tenantId: string;
  gstNumber?: string | null;
  taxRate: number;
  taxRegime: TaxRegime;
  financialYearStartMonth: number;
}) {
  const rows = await query<TaxSettingsRecord>(
    `INSERT INTO tax_settings (
       tenant_id, gst_number, tax_rate, tax_regime, financial_year_start_month
     )
     VALUES ($1, $2, $3, $4::tax_regime, $5)
     ON CONFLICT (tenant_id)
     DO UPDATE SET
       gst_number = EXCLUDED.gst_number,
       tax_rate = EXCLUDED.tax_rate,
       tax_regime = EXCLUDED.tax_regime,
       financial_year_start_month = EXCLUDED.financial_year_start_month,
       updated_at = NOW()
     RETURNING *`,
    [
      params.tenantId,
      params.gstNumber ?? null,
      params.taxRate,
      params.taxRegime,
      params.financialYearStartMonth
    ]
  );

  return {
    id: rows[0].id,
    gst_number: rows[0].gst_number,
    tax_rate: Number(rows[0].tax_rate),
    tax_regime: rows[0].tax_regime,
    financial_year_start_month: rows[0].financial_year_start_month,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at
  };
}

export function calculateGstAmount(baseAmount: number, taxRate: number, taxRegime: TaxRegime) {
  if (taxRegime !== 'gst' || taxRate <= 0 || baseAmount <= 0) return 0;
  return Math.round(baseAmount * taxRate) / 100;
}
