// import { Test, TestingModule } from '@nestjs/testing';
// import { NotFoundException } from '@nestjs/common';
// import { InventoryOrchestrationService } from 'src/modules/inventory/inventory-orchestration.service';
// import { ProductsService } from 'src/modules/products/products.service';
// import { SuppliersService } from 'src/modules/suppliers/suppliers.service';
// import { InventoryService } from 'src/modules/inventory/inventory.service';
// import { MovementsService } from 'src/modules/movements/movements.service';

// describe('InventoryOrchestrationService', () => {
//   let service: InventoryOrchestrationService;

//   // Mocks
//   const mockProductsService = {
//     findProductBySku: jest.fn(),
//     createProduct: jest.fn(),
//   };
//   const mockSuppliersService = {
//     findByNit: jest.fn(),
//   };
//   const mockInventoryService = {
//     createProductLot: jest.fn(),
//     createProductSerial: jest.fn(),
//   };
//   const mockMovementsService = {
//     create: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         InventoryOrchestrationService,
//         { provide: ProductsService, useValue: mockProductsService },
//         { provide: SuppliersService, useValue: mockSuppliersService },
//         { provide: InventoryService, useValue: mockInventoryService },
//         { provide: MovementsService, useValue: mockMovementsService },
//       ],
//     }).compile();

//     service = module.get<InventoryOrchestrationService>(InventoryOrchestrationService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should create inventory entry and new product if product not found', async () => {
//     const dto = {
//       product: { sku: 'sku-123', name: 'Test Product', barcode: 'barcode-1', category_id: 'cat-1' },
//       supplier_nit: 'supplier-nit-1',
//       lot: {
//         lot_number: 'lot-1',
//         manufacture_date: '2025-05-01',
//         expiration_date: '2026-05-01',
//         initial_quantity: 10,
//       },
//       location_id: 'loc-1',
//       movement: {
//         movement_type: 'IN',
//         quantity: 10,
//         user_id: 'user-1',
//         movement_date: '2025-05-30',
//       },
//       serials: ['serial1', 'serial2'],
//     };

//     // Mock: supplier found
//     mockSuppliersService.findByNit.mockResolvedValue({ id: 'supplier-1', nit: 'supplier-nit-1' });

//     // Mock: product NOT found initially
//     mockProductsService.findProductBySku.mockResolvedValue(null); // o undefined

//     // Mock: product created
//     mockProductsService.createProduct.mockResolvedValue({
//       id: 'product-1',
//       ...dto.product,
//     });

//     // Mock: createProductLot returns lot with id
//     mockInventoryService.createProductLot.mockResolvedValue({ id: 'lot-1' });

//     // Mock: serial creation resolves
//     mockInventoryService.createProductSerial.mockResolvedValue(null);

//     // Mock: movement creation resolves
//     mockMovementsService.create.mockResolvedValue(null);

//     const result = await service.createInventoryEntry(dto);

//     expect(mockSuppliersService.findByNit).toHaveBeenCalledWith(dto.supplier_nit);
//     expect(mockProductsService.findProductBySku).toHaveBeenCalledWith(dto.product.sku);
//     expect(mockProductsService.createProduct).toHaveBeenCalledWith(dto.product);
//     expect(mockInventoryService.createProductLot).toHaveBeenCalled();
//     expect(mockInventoryService.createProductSerial).toHaveBeenCalledTimes(dto.serials.length);
//     expect(mockMovementsService.create).toHaveBeenCalled();
//     expect(result).toEqual({ message: 'Entrada registrada correctamente.' });
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryOrchestrationService } from 'src/modules/inventory/inventory-orchestration.service';
import { ProductsService } from 'src/modules/products/products.service';
import { SuppliersService } from 'src/modules/suppliers/suppliers.service';
import { InventoryService } from 'src/modules/inventory/inventory.service';
import { MovementsService } from 'src/modules/movements/movements.service';

describe('InventoryOrchestrationService', () => {
  let service: InventoryOrchestrationService;

  const mockProductsService = {
    findProductBySku: jest.fn(),
    createProduct: jest.fn(),
  };
  const mockSuppliersService = {
    // Actualizar el mock para esperar el tenantId
    findByNit: jest.fn(), 
  };
  const mockInventoryService = {
    createProductLot: jest.fn(),
    createProductSerial: jest.fn(),
  };
  const mockMovementsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryOrchestrationService,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: SuppliersService, useValue: mockSuppliersService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: MovementsService, useValue: mockMovementsService },
      ],
    }).compile();

    service = module.get<InventoryOrchestrationService>(InventoryOrchestrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Definir un tenantId de prueba
  const testTenantId = 'test-tenant-id-123'; 

  const baseDto = {
    product: { name: 'Test Product', barcode: 'barcode-1', category_id: 'cat-1' },
    supplier_nit: 'supplier-nit-1',
    lot: {
      lot_number: 'lot-1',
      manufacture_date: '2025-05-01',
      expiration_date: '2026-05-01',
      initial_quantity: 10,
    },
    location_id: 'loc-1',
    movement: {
      movement_type: 'IN',
      quantity: 10,
      user_id: 'user-1',
      movement_date: '2025-05-30',
    },
  };

  it('should create full inventory entry when product not found and has serials', async () => {
    const dto = {
      ...baseDto,
      product: { ...baseDto.product, sku: 'sku-123' },
      serials: ['serial1', 'serial2'],
    };

    // El mock ahora espera el NIT y el tenantId
    mockSuppliersService.findByNit.mockResolvedValue({ id: 'supplier-1', tenant_id: testTenantId }); 
    mockProductsService.findProductBySku.mockResolvedValue(null);
    mockProductsService.createProduct.mockResolvedValue({ id: 'product-1', ...dto.product });
    mockInventoryService.createProductLot.mockResolvedValue({ id: 'lot-1' });
    mockInventoryService.createProductSerial.mockResolvedValue(null);
    mockMovementsService.create.mockResolvedValue(null);

    // Pasar el tenantId al método del servicio
    const result = await service.createInventoryEntry(dto, testTenantId); 

    // Verificar que findByNit fue llamado con ambos argumentos
    expect(mockSuppliersService.findByNit).toHaveBeenCalledWith('supplier-nit-1', testTenantId); 
    expect(mockProductsService.findProductBySku).toHaveBeenCalledWith('sku-123');
    expect(mockProductsService.createProduct).toHaveBeenCalledWith(dto.product);
    expect(mockInventoryService.createProductLot).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 'product-1' }),
    );
    expect(mockInventoryService.createProductSerial).toHaveBeenCalledTimes(2);
    expect(mockMovementsService.create).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Entrada registrada correctamente.' });
  });

  it('should create inventory for product without SKU', async () => {
    const dto = {
      ...baseDto,
      product: { ...baseDto.product, sku: undefined },
      serials: [],
    };

    // El mock ahora espera el NIT y el tenantId
    mockSuppliersService.findByNit.mockResolvedValue({ id: 'supplier-1', tenant_id: testTenantId }); 
    mockProductsService.findProductBySku.mockResolvedValue(undefined); 
    mockProductsService.createProduct.mockResolvedValue({ id: 'product-2', ...dto.product });
    mockInventoryService.createProductLot.mockResolvedValue({ id: 'lot-2' });
    mockMovementsService.create.mockResolvedValue(null);

    // Pasar el tenantId al método del servicio
    const result = await service.createInventoryEntry(dto, testTenantId); 

    // Verificar que findByNit fue llamado con ambos argumentos
    expect(mockSuppliersService.findByNit).toHaveBeenCalledWith('supplier-nit-1', testTenantId);
    expect(mockProductsService.createProduct).toHaveBeenCalled();
    expect(mockInventoryService.createProductSerial).not.toHaveBeenCalled();
    expect(result).toEqual({ message: 'Entrada registrada correctamente.' });
  });

  it('should skip product creation if already exists', async () => {
    const dto = {
      ...baseDto,
      product: { ...baseDto.product, sku: 'sku-existing' },
      serials: [],
    };

    // El mock ahora espera el NIT y el tenantId
    mockSuppliersService.findByNit.mockResolvedValue({ id: 'supplier-1', tenant_id: testTenantId }); 
    mockProductsService.findProductBySku.mockResolvedValue({ id: 'product-existing', ...dto.product });
    mockInventoryService.createProductLot.mockResolvedValue({ id: 'lot-3' });
    mockMovementsService.create.mockResolvedValue(null);

    // Pasar el tenantId al método del servicio
    const result = await service.createInventoryEntry(dto, testTenantId); 

    // Verificar que findByNit fue llamado con ambos argumentos
    expect(mockSuppliersService.findByNit).toHaveBeenCalledWith('supplier-nit-1', testTenantId);
    expect(mockProductsService.createProduct).not.toHaveBeenCalled();
    expect(mockInventoryService.createProductLot).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 'product-existing' }),
    );
    expect(result).toEqual({ message: 'Entrada registrada correctamente.' });
  });

  // Añadir una prueba para el caso de proveedor no encontrado
  it('should throw NotFoundException if supplier not found', async () => {
    const dto = {
      ...baseDto,
      supplier_nit: 'non-existent-nit',
    };

    // Configurar el mock para que devuelva null, simulando que no se encuentra el proveedor
    mockSuppliersService.findByNit.mockResolvedValue(null);

    // Esperar que el método lance una NotFoundException
    await expect(service.createInventoryEntry(dto, testTenantId)).rejects.toThrow(
      new NotFoundException('Proveedor no encontrado para el NIT proporcionado.'),
    );

    // Verificar que findByNit fue llamado con ambos argumentos
    expect(mockSuppliersService.findByNit).toHaveBeenCalledWith('non-existent-nit', testTenantId);
  });
});