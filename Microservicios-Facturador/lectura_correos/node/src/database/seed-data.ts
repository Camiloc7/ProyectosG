import { ProductionOrderStatus } from '../modules/production/entities/production-order.entity'; 
export interface RoleSeedData {
  name: string;
  description: string;
}
export interface UserSeedData {
  username: string;
  password_hash: string;
  roleName: string;
  is_active?: boolean; 
}
export interface SupplierCategorySeedData {
  name: string;
  description: string;
}
export interface SupplierSeedData {
  nit: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  verification_digit?: string;
  categoryName: string; 
  document_type?: string;
  commercial_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  contact_first_name?: string;
  contact_last_name?: string;
}
export interface ProductCategorySeedData {
  name: string;
  description?: string;
}
export interface LocationSeedData {
  name: string;
  description?: string;
  is_active?: boolean;
}
export interface ProductSeedData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  categoryName: string; 
  variants?: ProductVariantSeedData[];
  lots?: ProductLotSeedData[];
  serials?: ProductSerialSeedData[];
  inventory?: InventorySeedData[];
  movements?: MovementSeedData[];
}
export interface ProductVariantSeedData {
  name: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  sale_price: number;
  attribute1_name?: string;
  attribute1_value?: string;
  attribute2_name?: string;
  attribute2_value?: string;
}
export interface ProductLotSeedData {
  lot_number: string;
  supplierName: string; 
  initial_quantity: number;
  current_quantity: number;
  manufacture_date?: Date | string;
  expiration_date?: Date | string;
  status?: string;
}
export interface ProductSerialSeedData {
  serial_number: string;
  status?: string;
}
export interface InventorySeedData {
  lotNumber: string; 
  serialNumber?: string; 
  locationName: string;
  quantity: number;
}
export interface MovementSeedData {
  movement_type: string;
  lotNumber: string;
  serialNumber?: string;
  fromLocationName: string;
  toLocationName?: string; 
  quantity: number;
  notes?: string;
}
export interface BillOfMaterialItemSeedData {
  componentProductSku: string;
  quantity: number;
}
export interface BillOfMaterialSeedData {
  name: string;
  description?: string;
  quantity_produced: number;
  productSku: string; 
  items: BillOfMaterialItemSeedData[];
}
export interface ProductionOrderSeedData {
  order_number: string; 
  productSku: string;
  bomName: string;
  quantity_to_produce: number;
  status?: ProductionOrderStatus; 
  productionLocationName: string;
  start_date: string;
  createdByUser: string;
  quantity_produced?: number;
}
export interface SeedData {
  roles?: RoleSeedData[];
  users?: UserSeedData[];
  supplierCategories?: SupplierCategorySeedData[];
  suppliers?: SupplierSeedData[];
  productCategories?: ProductCategorySeedData[];
  locations?: LocationSeedData[];
  products?: ProductSeedData[];
  boms?: BillOfMaterialSeedData[];
  productionOrders?: ProductionOrderSeedData[];
}