export interface Category {
    id: string;
    name: string;
    description?: string;
    products?: string[];
    created_at: string;
    updated_at: string;
}

export interface Variant {
    id: string;
    sku: string;
    barcode: string;
    name: string;
    attribute1_name?: string;
    attribute1_value?: string;
    attribute2_name?: string;
    attribute2_value?: string;
    cost_price: number;
    sale_price: number;
    product: string; 
    product_id: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    barcode: string;
    cost_price: number;
    sale_price: number;
    category: Category;
    category_id: string;
    variants?: Variant[];
    created_at: string;
    updated_at: string;
}


export interface Item {
    id: number;
    descripcion: string;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
    factura_id: number;
}
//  --- Interfaces del BOM 

export interface BillOfMaterialComponent {
    id: string;
    billOfMaterial: string; 
    bom_id: string;
    componentProduct: Product;
    component_product_id: string;
    quantity: number;
    unit: string; 
    created_at: string;
    updated_at: string;
}

export interface BillOfMaterial {
    id: string;
    product: Product; 
    product_id: string;
    name: string;
    description?: string | null;
    quantity_produced: number;
    items: BillOfMaterialComponent[]; 
    created_at: string;
    updated_at: string;
}
export type CreateBomItemPayload = {
    component_product_id: string;
    quantity: number;
    unit: string; 
};
export type CreateBomPayload = {
    product_id: string;
    name: string;
    description?: string;
    quantity_produced: number;
    items: CreateBomItemPayload[];
};

export type UpdateBomPayload = Partial<CreateBomPayload>;


// --- Ubicaciones e Inventario 

// export interface Supplier {
//     id: string;
//     nit: string;
//     name: string;
//     contact_person?: string | null;
//     phone?: string | null;
//     email?: string | null;
//     address?: string | null;
//     notes?: string | null;
//     is_active: boolean;
//     verification_digit?: string | null;
//     city?: string | null;
//     notifications_enabled?: boolean;
//     document_type?: string | null;
//     contact_first_name?: string | null;
//     contact_middle_name?: string | null;
//     contact_last_name?: string | null;
//     contact_second_last_name?: string | null;
//     commercial_name?: string | null;
//     bank_account_type?: string | null;
//     bank_account_number?: string | null;
//     bank_name?: string | null;
//     category?: string | null; 
//     category_id?: string | null;
//     created_at: string;
//     updated_at: string;
// }

// src/types/inventory.ts


  export interface SupplierCategory {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    suppliers?: Supplier[]; 
  }
  
  export interface Supplier {
    id: string;
    nit: string;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    is_active: boolean;
    verification_digit?: string | null;
    city?: string | null;
    notifications_enabled?: boolean;
    document_type?: string | null;
    contact_first_name?: string | null;
    contact_middle_name?: string | null;
    contact_last_name?: string | null;
    contact_second_last_name?: string | null;
    commercial_name?: string | null;
    bank_account_type?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    category?: SupplierCategory | null;
    category_id?: string | null; 
    created_at: string;
    updated_at: string;
  }
  
  export interface APICategoryResponse {
    id: string;
    name: string;
    description: string;
    suppliers: Supplier[]; 
  }




export interface ProductLot {
    id: string;
    lot_number: string;
    product: Product;
    product_id: string;
    supplier: Supplier;
    supplier_id: string;
    manufacture_date?: string | null;
    expiration_date?: string | null;
    initial_quantity: number;
    current_quantity: number;
    status: string;
    inventoryItems?: InventoryItem[]; 
    received_at: string;
    created_at: string;
    updated_at: string;
}

export interface ProductSerial {
    id: string;
    serial_number: string;
    product: Product;
    product_id: string;
    status: string;
    received_at: string;
    inventoryItem: InventoryItem;
    created_at: string;
    updated_at: string;
}


export interface InventoryItem {
    id: string;
    product: Product; 
    product_id: string; 
    productVariant?: Variant | null; 
    product_variant_id?: string | null; 
    location: Location; 
    location_id: string; 
    productLot?: ProductLot | null; 
    product_lot_id?: string | null; 
    productSerial?: ProductSerial | null; 
    product_serial_id?: string | null; 
    quantity: number;
    created_at: string;
    updated_at: string;
}

// Interfaz Location 
export interface Location {
    id: string;
    name: string;
    description?: string | null;
    is_active: boolean; 
    address?: string; 
    is_production_site: boolean;
    inventoryItems?: InventoryItem[];
    created_at: string;
    updated_at: string;
}

// --- Interfaces de Usuario 
interface Usuario {
    id: string;
    username: string;
    password_hash?: string;
    role_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
  }
  
// --- Interfaces de Producción

export interface ProductionInput {
    id: string;
    production_order_id: string;
    product: Product;
    product_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

export interface ProductionOutput {
    id: string;
    production_order_id: string;
    product: Product;
    product_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}


export interface QualityCheck {
    id: string;
    productionOrder: ProductionOrder; 
    production_order_id: string;
    checkedBy: User; 
    checked_by_user_id: string;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductionOrder {
    id: string;
    order_number: string;
    product: Product;
    product_id: string;
    billOfMaterial: BillOfMaterial | null;
    bom_id: string | null;
    quantity_to_produce: number;
    quantity_produced: number;
    status: string;
    productionLocation: Location | null; 
    production_location_id: string | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    createdBy: User | null;
    created_by_user_id: string | null;
    inputs: ProductionInput[];
    outputs: ProductionOutput[];
    qualityChecks: QualityCheck[];
    created_at: string;
    updated_at: string;
}

export type CreateProductionOutputPayload = {
    production_order_id: string;
    product_id: string;
    quantity: number;
};


// --- Payload para crear un Producto (con sus variantes anidadas)
export type CreateProductVariantPayload = {
    sku: string;
    barcode: string;
    name: string;
    attribute1_name?: string;
    attribute1_value?: string;
    attribute2_name?: string;
    attribute2_value?: string;
    cost_price: number;
    sale_price: number;
};

export type CreateProductPayload = {
    sku: string;
    name: string;
    description?: string | null;
    barcode: string;
    cost_price: number;
    sale_price: number;
    category_id: string;
    variants?: CreateProductVariantPayload[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;



// export type CreateProductionInputPayload = {
//     product_id: string;
//     quantity: number;
// };

export type CreateProductionInputPayload = {
    production_order_id: string;
    material_product_id: string; 
    from_location_id: string;   
    quantity_consumed: number;   
    product_lot_id?: string | null;    
    product_serial_id?: string | null;  
    notes?: string | null;             
    consumption_date?: string | null;   
};


export type CreateQualityCheckPayload = {
    production_order_id: string;
    checked_by_user_id: string;
    status: string;
    notes?: string | null;
};

export type UpdateQualityCheckPayload = Partial<CreateQualityCheckPayload>;

export type CreateProductionOrderPayload = {
    order_number?: string; 
    product_id: string;
    bom_id?: string | null;
    quantity_to_produce: number;
    production_location_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    created_by_user_id?: string | null
};

export type UpdateProductionOrderPayload = Partial<CreateProductionOrderPayload>;


export interface Movement {
    id: string;
    movement_type: string; // Ej: 'reception', 'dispatch', 'transfer', 'adjustment_positive', 'adjustment_negative', etc.
    product: Product;
    product_id: string;
    productVariant?: Variant | null;
    product_variant_id?: string | null;
    fromLocation?: Location | null; // Ubicación de origen (para salidas/transferencias)
    from_location_id?: string | null;
    toLocation?: Location | null; // Ubicación de destino (para entradas/transferencias)
    to_location_id?: string | null;
    productLot?: ProductLot | null;
    product_lot_id?: string | null;
    productSerial?: ProductSerial | null;
    product_serial_id?: string | null;
    quantity: number;
    reference_document_id?: string | null;
    reference_document_type?: string | null;
    notes?: string | null;
    user_id?: string | null; // ID del usuario que realizó el movimiento
    movement_date: string; // Fecha del movimiento (ISO 8601 string)
    created_at: string;
    updated_at: string;
}

// Payload para crear un nuevo movimiento
export type CreateMovementPayload = {
    movement_type: string;
    product_id: string;
    product_variant_id?: string | null;
    from_location_id?: string | null;
    to_location_id?: string | null;
    product_lot_id?: string | null;
    product_serial_id?: string | null;
    quantity: number;
    reference_document_id?: string | null;
    reference_document_type?: string | null;
    notes?: string | null;
    user_id?: string | null;
    movement_date: string; 
};

export type UpdateMovementPayload = Partial<CreateMovementPayload>;



// types/invoice.ts
export interface InvoiceItem {
    id: number;
    descripcion: string;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
    invoice_id: number;
  }
  
  export interface Invoice {
    cufe: string;
    numero_factura: string;
    fecha_emision: string; 
    hora_emision: string;
    monto_subtotal: number;
    monto_impuesto: number;
    monto_total: number;
    moneda: string;
    nombre_proveedor: string;
    nit_proveedor: string;
    email_proveedor: string;
    nombre_cliente: string;
    nit_cliente: string;
    fecha_vencimiento: string; // Keep as string for now
    metodo_pago: string;
    asunto_correo: string;
    remitente_correo: string;
    correo_cliente_asociado: string;
    revisada_manualmente: boolean;
    ruta_archivo_original: string;
    procesado_en: string; // Keep as string for now
    id: number;
    categoria_proveedor_id: number;
    usuario_id: number;
    items: InvoiceItem[];
  }
  export type CreateInvoicePayload = Omit<Invoice, 'id' | 'procesado_en' | 'items'>;
  export type UpdateInvoicePayload = Partial<CreateInvoicePayload>; 