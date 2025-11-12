export interface FixedAsset {
  id: string;
  description: string;
  barcode: string;
  location: string; 
  responsible: string | null; 
  purchase_date: string; 
  purchase_value: number; 
  useful_life_years: number; 
  depreciation_method: string; 
  puc_code: string | null; 
  classification: string | null; 
  accounting_note: string | null; 
  created_at: Date; 
  updated_at: Date; 
}

export interface FixedAssetDto {
  description: string;
  barcode: string;
  location: string;
  responsible?: string | null; 
  purchase_date: string; 
  purchase_value: number;
  useful_life_years: number;
  depreciation_method: string;
  puc_code?: string | null;
  classification?: string | null;
  accounting_note?: string | null;
}
export interface CreateFixedAssetDto {
  assets: FixedAssetDto[];
}
export interface UpdateFixedAssetDto {
  assets: FixedAssetDto[];
}


export interface AssetSummary {
    equipos_computo: number;
    mobiliario: number;
    maquinaria: number; 
    total: number;
}

export interface NiifSummary {
    '2023': AssetSummary;
    '2022': AssetSummary;
    variation_annual: number;
    percentage_variation: number; 
    accumulated_deterioration: number; 
}