import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EstablecimientosService } from '../modules/establecimientos/establecimientos.service';
import { CreateEstablecimientoDto } from '../modules/establecimientos/dto/create-establecimiento.dto';
import { UsuariosService } from '../modules/usuarios/usuarios.service';
import { CreateUsuarioDto } from '../modules/usuarios/dto/create-usuario.dto';
import { RolesService } from '../modules/roles/roles.service';
import { MediosPagoService } from '../modules/medios-pago/medios-pago.service';
import { CreateMedioPagoDto } from '../modules/medios-pago/dto/create-medio-pago.dto';
import { CategoriasService } from '../modules/categorias/categorias.service';
import { CreateCategoriaDto } from '../modules/categorias/dto/create-categoria.dto';
import { MesasService } from '../modules/mesas/mesas.service';
import { CreateMesaDto } from '../modules/mesas/dto/create-mesa.dto';
import { ProveedoresService } from '../modules/proveedores/proveedores.service';
import { CreateProveedorDto } from '../modules/proveedores/dto/create-proveedor.dto';
import { IngredientesService } from '../modules/ingredientes/ingredientes.service';
import { CreateIngredienteDto } from '../modules/ingredientes/dto/create-ingrediente.dto';
import { ProductosService } from '../modules/productos/productos.service';
import { RecetaItemDto } from '../modules/productos/dto/create-producto.dto';
import { ComprasService } from '../modules/compras/compras.service';
import { CreateCompraDto } from '../modules/compras/dto/create-compra.dto';
import { PedidosService } from '../modules/pedidos/pedidos.service';
import { CreatePedidoDto } from '../modules/pedidos/dto/create-pedido.dto';
import { CreatePedidoItemDto } from '../modules/pedidos/dto/create-pedido-item.dto';
import { FacturasService } from '../modules/facturas/facturas.service';
import { CreateFacturaAndPaymentDto } from '../modules/facturas/dto/create-factura-and-payment.dto';
import { ClientesService } from '../modules/clientes/clientes.service';
import { CreateClienteDto } from '../modules/clientes/dto/create-cliente.dto';
import { CuentasBancariasService } from '../modules/cuentas-banco/cuentas-bancarias.service';
import { CierreCajaService } from '../modules/cierre-caja/cierre-caja.service';
import { CreateCierreCajaDto } from '../modules/cierre-caja/dto/create-cierre-caja.dto';
import { EstablecimientoConfiguracionPedidoService } from '../modules/establecimientos/configuracion-pedidos.service';
import { CreateEstablecimientoConfiguracionPedidoDto } from '../modules/establecimientos/dto/create-configuracion-pedidos.dto';
import { PagoEntity } from '../modules/pagos/entities/pago.entity';
import { FacturaEntity } from '../modules/facturas/entities/factura.entity';
import { MedioPagoEntity } from '../modules/medios-pago/entities/medio-pago.entity';
import { ClienteEntity } from '../modules/clientes/entities/cliente.entity';
import { EstadoMesa } from '../modules/mesas/entities/mesa.entity';
import { EstadoPedido, TipoPedido } from '../modules/pedidos/entities/pedido.entity';
import { EstadoCocina, TipoProductoPedido } from '../modules/pedidos/entities/pedido-item.entity';
import { RoleName, GLOBAL_ESTABLISHMENT_ID } from '../common/constants/app.constants';
const idMap: { [key: string]: string } = {};
function getMappedId(jsonId: string): string {
  if (jsonId === null || jsonId === undefined) {
    throw new Error(`Intento de mapear un ID nulo o indefinido. Esto puede indicar un error en seed-data.json.`);
  }
  if (idMap[jsonId]) {
    return idMap[jsonId];
  }
  if (jsonId === GLOBAL_ESTABLISHMENT_ID) {
    idMap[jsonId] = jsonId;
    return jsonId;
  }
  const newUuid = uuidv4();
  idMap[jsonId] = newUuid;
  return newUuid;
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private errors: string[] = [];
  constructor(
    private readonly dataSource: DataSource,
    private readonly establecimientosService: EstablecimientosService,
    private readonly usuariosService: UsuariosService,
    private readonly rolesService: RolesService,
    private readonly mediosPagoService: MediosPagoService,
    private readonly categoriasService: CategoriasService,
    private readonly mesasService: MesasService,
    private readonly proveedoresService: ProveedoresService,
    private readonly ingredientesService: IngredientesService,
    private readonly productosService: ProductosService,
    private readonly comprasService: ComprasService,
    private readonly pedidosService: PedidosService,
    private readonly facturasService: FacturasService,
    private readonly clientesService: ClientesService,
    private readonly cuentasBancariasService: CuentasBancariasService,
    private readonly cierreCajaService: CierreCajaService,
    private readonly establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService,
  ) {}
  private addError(message: string) {
    this.errors.push(message);
    this.logger.error(message);
  }
  async seedRoles(rolesData: any[]) {
    this.logger.log('--- Sembrando Roles ---');
    for (const roleData of rolesData) {
      try {
        const existingRole = await this.rolesService.findOneByName(roleData.nombre);
        if (!existingRole) {
          await this.rolesService.create(roleData);
          this.logger.log(`- Rol '${roleData.nombre}' creado.`);
        } else {
          idMap[roleData.id] = existingRole.id;
          this.logger.log(`- Rol '${roleData.nombre}' ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar rol '${roleData.nombre}': ${error.message}`);
      }
    }
  }
  async seedEstablecimientos(establecimientosData: any[]) {
    this.logger.log('--- Sembrando Establecimientos ---');
    for (const estData of establecimientosData) {
      try {
        let existingEstablecimiento = await this.establecimientosService.findByName(estData.nombre);
        let currentMappedId = getMappedId(estData.id);

        if (!existingEstablecimiento) {
          const createDto: CreateEstablecimientoDto = { ...estData, id: currentMappedId };
          const newEstablecimiento = await this.establecimientosService.create(createDto);
          idMap[estData.id] = newEstablecimiento.id;
          this.logger.log(`- Establecimiento '${estData.nombre}' (${newEstablecimiento.id}) creado.`);
        } else {
          idMap[estData.id] = existingEstablecimiento.id;
          this.logger.log(`- Establecimiento '${estData.nombre}' (${existingEstablecimiento.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar establecimiento '${estData.nombre}': ${error.message}`);
      }
    }
  }

  async seedEstablecimientoConfiguracionPedido(establecimientosData: any[]) {
    this.logger.log('--- Sembrando Configuración de Pedido por Establecimiento (puede ser reescrito si el servicio lo inicializa) ---');
    for (const estData of establecimientosData) {
      try {
        const mappedEstablecimientoId = getMappedId(estData.id);
        const establecimiento = await this.establecimientosService.findOne(mappedEstablecimientoId);

        if (!establecimiento) {
          this.logger.warn(`- Establecimiento ID '${mappedEstablecimientoId}' no encontrado para configurar pedido. Saltando.`);
          continue;
        }

        const existingConfig = await this.establecimientoConfiguracionPedidoService.findOneByEstablecimientoId(establecimiento.id);

        if (!existingConfig) {
          const newConfigDto: CreateEstablecimientoConfiguracionPedidoDto = {
            establecimiento_id: establecimiento.id,
            limite_cancelacion_preparacion_minutos: estData.configuracionPedido?.limite_cancelacion_preparacion_minutos || 10,
            limite_cancelacion_enviado_cocina_minutos: estData.configuracionPedido?.limite_cancelacion_enviado_cocina_minutos || 5,
            limite_edicion_pedido_minutos: estData.configuracionPedido?.limite_edicion_pedido_minutos || 15,
          };
          await this.establecimientoConfiguracionPedidoService.create(newConfigDto);
          this.logger.log(`- Configuración de pedido creada para establecimiento '${establecimiento.nombre}' (${establecimiento.id}).`);
        } else {
          this.logger.log(`- Configuración de pedido para establecimiento '${establecimiento.nombre}' (${establecimiento.id}) ya existe.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar configuración de pedido para establecimiento '${estData.nombre}': ${error.message}`);
      }
    }
  }

  async seedCierreCaja(establecimientosData: any[]) {
    this.logger.log('--- Sembrando Cierre de Caja (puede ser reescrito si la caja se inicializa en otro lugar) ---');
    const cajeroRole = await this.rolesService.findOneByName(RoleName.CAJERO);
    if (!cajeroRole) {
      this.logger.warn(`- Rol '${RoleName.CAJERO}' no encontrado. No se puede sembrar cierre de caja sin un cajero válido. Saltando.`);
      return;
    }
    const mainEstablishmentId = getMappedId('e1-uuid-establecimiento-principal');
    const establecimiento = await this.establecimientosService.findOne(mainEstablishmentId);
    if (establecimiento) {
      const existingCierre = await this.cierreCajaService.obtenerCierreCajaActivo(establecimiento.id, cajeroRole.id);

      if (!existingCierre) {
        const cajero = await this.usuariosService.findOneByRoleAndEstablecimiento(cajeroRole.id, establecimiento.id);

        if (!cajero) {
          this.logger.warn(`- No se encontró usuario cajero para el establecimiento '${establecimiento.nombre}'. No se puede crear cierre de caja inicial. Saltando.`);
          return;
        }
        const newCierreDto: CreateCierreCajaDto = {
          establecimientoId: establecimiento.id,
          usuarioCajeroId: cajero.id,
          denominaciones_apertura: {
            '100000': 0,
            '50000': 0,
            '1000': 0
          },
        };
        await this.cierreCajaService.abrirCaja(newCierreDto);
        this.logger.log(`- Cierre de caja inicial creado para establecimiento '${establecimiento.nombre}' por cajero '${cajero.username}'.`);
      } else {
        this.logger.log(`- Cierre de caja inicial para establecimiento '${establecimiento.nombre}' ya existe.`);
      }
    } else {
      this.logger.warn(`- Establecimiento principal para cierre de caja no encontrado. Saltando siembra de CierreCaja.`);
    }
  }

  async seedUsuarios(usuariosData: any[]) {
    this.logger.log('--- Sembrando Usuarios ---');
    for (const userData of usuariosData) {
      try {
        let existingUser = await this.usuariosService.findOneByUsername(userData.username);
        let currentMappedId = getMappedId(userData.id);

        if (!existingUser) {
          const role = await this.rolesService.findOneByName(userData.roleName);

          if (!role) {
            this.addError(`ERROR: Rol '${userData.roleName}' no encontrado para usuario '${userData.username}'. Saltando.`);
            continue;
          }
        let establecimientoNameForDto: string;
        let targetEstablecimientoId: string;

        if (userData.roleName === RoleName.SUPER_ADMIN) {
          targetEstablecimientoId = GLOBAL_ESTABLISHMENT_ID;
          const globalEstablecimiento = await this.establecimientosService.findOne(GLOBAL_ESTABLISHMENT_ID);
          if (!globalEstablecimiento) {
              this.addError(`ERROR: Establecimiento global con ID '${GLOBAL_ESTABLISHMENT_ID}' no encontrado para superadmin. Asegúrate de que el establecimiento global se siembre primero.`);
              continue;
          }
          establecimientoNameForDto = globalEstablecimiento.nombre;
        } else {
          if (!userData.establecimientoId) {
            this.addError(`ERROR: Usuario '${userData.username}' (Rol: ${userData.roleName}) requiere un establecimiento, pero 'establecimientoId' no está presente. Saltando.`);
            continue;
          }
          targetEstablecimientoId = getMappedId(userData.establecimientoId);
          const establecimiento = await this.establecimientosService.findOne(targetEstablecimientoId);

          if (!establecimiento) {
            this.addError(`ERROR: Establecimiento ID '${targetEstablecimientoId}' no encontrado para usuario '${userData.username}'. Saltando.`);
            continue;
          }
          establecimientoNameForDto = establecimiento.nombre;
        }

        const createDto: CreateUsuarioDto = {
          ...userData,
          rolName: role.nombre,
          establecimientoName: establecimientoNameForDto,
          password: userData.password,
        };
          const newUser = await this.usuariosService.create(createDto);
          idMap[userData.id] = newUser.id;
          this.logger.log(`- Usuario '${userData.username}' (${newUser.id}) creado con rol '${role.nombre}'.`);
        } else {
          idMap[userData.id] = existingUser.id;
          this.logger.log(`- Usuario '${userData.username}' (${existingUser.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar usuario '${userData.username}': ${error.message}`);
      }
    }
  }

  async seedMediosPago(mediosPagoData: any[]) {
    this.logger.log('--- Sembrando Medios de Pago (puede ser reescrito para "Efectivo") ---');
    for (const mpData of mediosPagoData) {
      try {
        const realEstablecimientoId = getMappedId(mpData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para medio de pago '${mpData.nombre}'. Saltando.`);
          continue;
        }

        let medioPagoEfectivo = await this.mediosPagoService.findByName('Efectivo', establecimiento.id);
        let currentMappedId = getMappedId(mpData.id);

        if (!medioPagoEfectivo) {
          const createMedioPagoEfectivoDto: CreateMedioPagoDto = {
            establecimiento_id: establecimiento.id,
            nombre: 'Efectivo',
            es_efectivo: true,
            activo: true,
          };
          const newMedioPago = await this.mediosPagoService.create(createMedioPagoEfectivoDto);
          idMap[mpData.id] = newMedioPago.id;
          this.logger.log(`- Medio de pago '${newMedioPago.nombre}' (${newMedioPago.id}) creado.`);
        } else {
          idMap[mpData.id] = medioPagoEfectivo.id;
          this.logger.log(`- Medio de pago '${medioPagoEfectivo.nombre}' (${medioPagoEfectivo.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar medio de pago '${mpData.nombre}': ${error.message}`);
      }
    }
  }

  async seedCategorias(categoriasData: any[]) {
    this.logger.log('--- Sembrando Categorías ---');
    for (const catData of categoriasData) {
      try {
        const realEstablecimientoId = getMappedId(catData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para categoría '${catData.nombre}'. Saltando.`);
          continue;
        }

        let existingCategoria = await this.categoriasService.findByName(catData.nombre, establecimiento.id);
        let currentMappedId = getMappedId(catData.id);

        if (!existingCategoria) {
          const createDto: CreateCategoriaDto = {
            ...catData,
            establecimiento_id: establecimiento.id,
            id: currentMappedId,
          };
          const newCategoria = await this.categoriasService.create(createDto);
          idMap[catData.id] = newCategoria.id;
          this.logger.log(`- Categoría '${catData.nombre}' (${newCategoria.id}) creada.`);
        } else {
          idMap[catData.id] = existingCategoria.id;
          this.logger.log(`- Categoría '${catData.nombre}' (${existingCategoria.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar categoría '${catData.nombre}': ${error.message}`);
      }
    }
  }

  async seedMesas(mesasData: any[]) {
    this.logger.log('--- Sembrando Mesas ---');
    for (const mesaData of mesasData) {
      try {
        const realEstablecimientoId = getMappedId(mesaData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para mesa '${mesaData.numero}'. Saltando.`);
          continue;
        }

        let existingMesa = await this.mesasService.findByNumero(mesaData.numero, establecimiento.id);
        let currentMappedId = getMappedId(mesaData.id);

        if (!existingMesa) {
          const createDto: CreateMesaDto = {
            ...mesaData,
            establecimiento_id: establecimiento.id,
            id: currentMappedId,
            estado: mesaData.estado as EstadoMesa,
          };
          const newMesa = await this.mesasService.create(createDto);
          idMap[mesaData.id] = newMesa.id;
          this.logger.log(`- Mesa '${mesaData.numero}' (${newMesa.id}) creada.`);
        } else {
          idMap[mesaData.id] = existingMesa.id;
          this.logger.log(`- Mesa '${mesaData.numero}' (${existingMesa.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar mesa '${mesaData.numero}': ${error.message}`);
      }
    }
  }

  async seedProveedores(proveedoresData: any[]) {
    this.logger.log('--- Sembrando Proveedores ---');
    for (const provData of proveedoresData) {
      try {
        const realEstablecimientoId = getMappedId(provData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para proveedor '${provData.nombre}' (ID: ${realEstablecimientoId}). Saltando.`);
          continue;
        }

        let existingProveedor = await this.proveedoresService.findByNameOrNit(provData.nombre, provData.nit, establecimiento.id);
        let currentMappedId = getMappedId(provData.id);

        if (!existingProveedor) {
          const createDto: CreateProveedorDto = {
            ...provData,
            establecimiento_id: establecimiento.id,
            id: currentMappedId,
          };
          const newProveedor = await this.proveedoresService.create(createDto);
          idMap[provData.id] = newProveedor.id;
          this.logger.log(`- Proveedor '${provData.nombre}' (${newProveedor.id}) creado para establecimiento '${establecimiento.nombre}'.`);
        } else {
          idMap[provData.id] = existingProveedor.id;
          this.logger.log(`- Proveedor '${provData.nombre}' (${existingProveedor.id}) ya existe para establecimiento '${establecimiento.nombre}'. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar proveedor '${provData.nombre}': ${error.message}`);
      }
    }
  }

  async seedIngredientes(ingredientesData: any[]) {
    this.logger.log('--- Sembrando Ingredientes ---');
    for (const ingData of ingredientesData) {
      try {
        const realEstablecimientoId = getMappedId(ingData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para ingrediente '${ingData.nombre}' (ID: ${realEstablecimientoId}). Saltando.`);
          continue;
        }

        let existingIngrediente = await this.ingredientesService.findByName(ingData.nombre, establecimiento.id);
        let currentMappedId = getMappedId(ingData.id);

        if (!existingIngrediente) {
          const createDto: CreateIngredienteDto = {
            ...ingData,
            establecimiento_id: establecimiento.id,
            id: currentMappedId,
            fecha_ultima_compra: ingData.fecha_ultima_compra ? new Date(ingData.fecha_ultima_compra) : null,
          };
          const newIngrediente = await this.ingredientesService.create(createDto);
          idMap[ingData.id] = newIngrediente.id;
          this.logger.log(`- Ingrediente '${ingData.nombre}' (${newIngrediente.id}) creado.`);
        } else {
          idMap[ingData.id] = existingIngrediente.id;
          this.logger.log(`- Ingrediente '${ingData.nombre}' (${existingIngrediente.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar ingrediente '${ingData.nombre}': ${error.message}`);
      }
    }
  }

  async seedProductos(productosData: any[]) {
    this.logger.log('--- Sembrando Productos y Recetas ---');
    for (const prodData of productosData) {
      try {
        const realEstablecimientoId = getMappedId(prodData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para producto '${prodData.nombre}'. Saltando.`);
          continue;
        }

        let existingProducto = await this.productosService.findByName(prodData.nombre, establecimiento.id);
        let currentMappedId = getMappedId(prodData.id);

        if (!existingProducto) {
          const categoria = await this.categoriasService.findOne(getMappedId(prodData.categoriaId), establecimiento.id);

          if (!categoria) {
            this.addError(`ERROR: Categoría asociada no encontrada para producto '${prodData.nombre}'. Saltando.`);
            continue;
          }

          const createDto: any = {
            ...prodData,
            establecimiento_id: establecimiento.id,
            categoria_id: categoria.id,
            id: currentMappedId,
            receta: [],
          };
          const newProducto = await this.productosService.create(createDto);
          idMap[prodData.id] = newProducto.id;
          this.logger.log(`- Producto '${prodData.nombre}' (${newProducto.id}) creado.`);

          if (prodData.receta && prodData.receta.length > 0) {
            for (const recetaItem of prodData.receta) {
              try {
                const ingredienteJsonId = recetaItem.ingredienteId;
                const ingrediente = await this.ingredientesService.findOne(getMappedId(ingredienteJsonId), establecimiento.id);

                if (!ingrediente) {
                  this.addError(`ERROR: Ingrediente '${ingredienteJsonId}' no encontrado para receta de producto '${prodData.nombre}'. Saltando item de receta.`);
                  continue;
                }
                const createRecetaItemDto: RecetaItemDto = {
                  ingrediente_id: ingrediente.id,
                  cantidad_necesaria: recetaItem.cantidad_necesaria,
                };
                await this.productosService.addRecetaItem(newProducto.id, createRecetaItemDto);
                this.logger.log(`--- Receta para '${prodData.nombre}' con ingrediente '${ingrediente.nombre}' creada.`);
              } catch (error: any) {
                this.addError(`ERROR: Fallo al sembrar item de receta para producto '${prodData.nombre}' (ingrediente: ${recetaItem.ingredienteId}): ${error.message}`);
              }
            }
          }
        } else {
          idMap[prodData.id] = existingProducto.id;
          this.logger.log(`- Producto '${prodData.nombre}' (${existingProducto.id}) ya existe.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar producto '${prodData.nombre}': ${error.message}`);
      }
    }
  }
  async seedComprasIngredientes(comprasData: any[]) {
    this.logger.log('--- Sembrando Compras de Ingredientes ---');
    for (const compraData of comprasData) {
        try {
            const mappedCompraId = getMappedId(compraData.id);
            const mappedEstablecimientoId = getMappedId(compraData.establecimientoId);
            const establecimiento = await this.establecimientosService.findOne(mappedEstablecimientoId);
            if (!establecimiento) {
                this.addError(`ERROR: Fallo al sembrar compra de ingrediente (${compraData.id}): Establecimiento con ID "${mappedEstablecimientoId}" no encontrado.`);
                continue; 
            }
            let existingCompra = await this.comprasService.findOne(mappedCompraId, mappedEstablecimientoId);
            if (!existingCompra) {
                const mappedIngredienteId = getMappedId(compraData.ingredienteId);
                let ingrediente = await this.ingredientesService.findOne(mappedIngredienteId, mappedEstablecimientoId);
                
                if (!ingrediente) {
                    const createIngredienteDto: CreateIngredienteDto = {
                        establecimiento_id: mappedEstablecimientoId,
                        nombre: compraData.nombre_ingrediente || `Ingrediente ${compraData.ingredienteId}`,
                        unidad_medida: compraData.unidad_medida_ingrediente || 'unidades',
                        stock_actual: 0,
                        stock_minimo: 0,
                        costo_unitario: 0,
                        observaciones: `Creado por seeder para compra ${compraData.id}`,
                        volumen_por_unidad: compraData.volumen_por_unidad_ingrediente || 1, 
                    };
                    ingrediente = await this.ingredientesService.create(createIngredienteDto);
                    this.logger.log(`- Ingrediente '${ingrediente.nombre}' (${ingrediente.id}) creado como parte de la siembra de compras.`);
                }
                const mappedProveedorId = getMappedId(compraData.proveedorId);
                let proveedor = await this.proveedoresService.findOne(mappedProveedorId, mappedEstablecimientoId);
                
                if (!proveedor) {
                    const createProveedorDto: CreateProveedorDto = {
                        establecimiento_id: mappedEstablecimientoId,
                        nombre: compraData.nombre_proveedor || `Proveedor ${compraData.proveedorId}`,
                        nit: compraData.nit_proveedor || `NIT-${compraData.proveedorId}`,
                        telefono: '1234567890',
                    };
                    proveedor = await this.proveedoresService.create(createProveedorDto);
                    this.logger.log(`- Proveedor '${proveedor.nombre}' (${proveedor.id}) creado como parte de la siembra de compras.`);
                }
                const createCompraDto: CreateCompraDto = {
                    ingrediente_id: ingrediente.id,
                    proveedor_id: proveedor.id,
                    cantidad_comprada: compraData.cantidad_comprada,
                    unidad_medida_compra: compraData.unidad_medida_compra,
                    costo_unitario_compra: compraData.costo_unitario_compra,
                    fecha_compra: compraData.fecha_compra ? new Date(compraData.fecha_compra).toISOString() : new Date().toISOString(),
                    numero_factura: compraData.numero_factura,
                    notas: compraData.notas,
                };
                
                await this.comprasService.create(createCompraDto);
                this.logger.log(`- Compra de ingrediente para '${ingrediente.nombre}' (${mappedCompraId}) creada.`);

            } else {
                this.logger.log(`- Compra de ingrediente (${mappedCompraId}) ya existe.`);
            }
        } catch (error: any) {
            this.addError(`ERROR: Fallo al sembrar compra de ingrediente (${compraData.id}): ${error.message}`);
        }
    }
  }

  async seedPedidos(pedidosData: any[]) {
    this.logger.log('--- Sembrando Pedidos e Items ---');
    for (const pedData of pedidosData) {
      try {
        const mappedId = getMappedId(pedData.id);
        const mappedEstablecimientoId = getMappedId(pedData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(mappedEstablecimientoId);
        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento con ID "${mappedEstablecimientoId}" no encontrado para pedido '${pedData.id}'. Saltando.`);
          continue;
        }

        const existingPedido = await this.pedidosService.findOne(mappedId, mappedEstablecimientoId);

        if (!existingPedido) {
          const usuarioCreador = await this.usuariosService.findOne(getMappedId(pedData.usuarioCreadorId), establecimiento.id);

          if (!usuarioCreador) {
            this.addError(`ERROR: Usuario creador no encontrado para pedido '${pedData.id}'. Saltando.`);
            continue;
          }

          if (pedData.tipo_pedido === TipoPedido.MESA && !pedData.mesa_id) { 
            this.addError(`ERROR: Pedido (${pedData.id}): Para pedidos de mesa, el ID de la mesa es obligatorio.`);
            continue;
          }

          const pedidoItemsForCreation: CreatePedidoItemDto[] = [];
          if (pedData.items && pedData.items.length > 0) {
            for (const itemData of pedData.items) {
              const producto = await this.productosService.findOne(getMappedId(itemData.productoId), establecimiento.id);
              if (!producto) {
                this.addError(`ERROR: Producto '${itemData.productoId}' no encontrado para item de pedido '${pedData.id}'. Saltando item.`);
                continue;
              }
              pedidoItemsForCreation.push({
                tipo_producto: TipoProductoPedido.SIMPLE ,
                producto_id: producto.id,
                cantidad: itemData.cantidad,
                notas_item: itemData.notas_item || null,
                estado_cocina: itemData.estado_cocina as EstadoCocina || EstadoCocina.PENDIENTE,
              });
            }
          } else {
            this.addError(`ERROR: Pedido '${pedData.id}' no contiene ítems. Se requiere al menos un ítem.`);
            continue; 
          }

          const createDto: CreatePedidoDto = {
            ...pedData,
            id: mappedId,
            establecimiento_id: establecimiento.id,
            usuario_creador_id: usuarioCreador.id,
            estado: pedData.estado as EstadoPedido,
            tipo_pedido: pedData.tipo_pedido as TipoPedido, 
            fecha_hora_pedido: pedData.fecha_hora_pedido ? new Date(pedData.fecha_hora_pedido) : new Date(),
            fecha_hora_cierre: pedData.fecha_hora_cierre ? new Date(pedData.fecha_hora_cierre) : null,
            pedidoItems: pedidoItemsForCreation, 
          };
          
          const savedPedido = await this.pedidosService.create(createDto, usuarioCreador.id, establecimiento.id);
          idMap[pedData.id] = savedPedido.id;
          this.logger.log(`- Pedido (${savedPedido.id}) creado.`);

        } else {
          idMap[pedData.id] = existingPedido.id;
          this.logger.log(`- Pedido (${existingPedido.id}) ya existe.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar pedido (${pedData.id}): ${error.message}`);
      }
    }
  }
  async seedFacturas(facturasData: any[]) {
    this.logger.log('--- Sembrando Facturas y Pagos ---');
    for (const factData of facturasData) {
      try {
        const mappedFacturaId = getMappedId(factData.id);
        const mappedEstablecimientoId = getMappedId(factData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(mappedEstablecimientoId);
        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento con ID "${mappedEstablecimientoId}" no encontrado para factura '${factData.id}'. Saltando.`);
          continue;
        }
        let existingFactura = await this.dataSource.getRepository(FacturaEntity).findOne({ where: { id: mappedFacturaId, establecimiento_id: mappedEstablecimientoId } });
        if (!existingFactura) {
          const pedido = await this.pedidosService.findOne(getMappedId(factData.pedidosAsociados[0].pedidoId), establecimiento.id);
          if (!pedido) {
            this.addError(`ERROR: Pedido con ID "${factData.pedidoId}" no encontrado para factura '${factData.id}' en el establecimiento "${establecimiento.id}". Saltando.`);
            continue;
          }
          let cliente: ClienteEntity | null = null;
          const clienteDtoForCreation: CreateClienteDto = {
            tipo_documento: factData.cliente?.tipo_documento || null,
            numero_documento: factData.cliente?.numero_documento || null,
            nombre_completo: factData.cliente?.nombre_completo || null,
            correo_electronico: factData.cliente?.correo_electronico || null,
            direccion: factData.cliente?.direccion || null,
            telefono: factData.cliente?.telefono || null,
            DV: factData.cliente?.DV || null,
          };
          cliente = await this.clientesService.getOrCreateCliente(clienteDtoForCreation, establecimiento.id);
          
          if (!cliente) {
            this.addError(`ERROR: No se pudo obtener o crear cliente para factura '${factData.id}'. Saltando.`);
            continue;
          }
          if (factData.cliente?.id) { 
            idMap[factData.cliente.id] = cliente.id;
          }
          if (!factData.pagos || factData.pagos.length === 0) {
            this.addError(`ERROR: Factura '${factData.id}' no tiene pagos definidos. Se requiere al menos un pago.`);
            continue;
          }
          const primerPago = factData.pagos[0];
          let esEfectivo = primerPago.metodo_pago === 'Efectivo';
          let cuentaId: string | undefined = undefined;
          let denominacionesEfectivo: { [key: string]: number } | null = null;

          if (esEfectivo) {
            const cuentaEfectivo = await this.cuentasBancariasService.findDefaultCashAccount(establecimiento.id);
            if (!cuentaEfectivo) {
              this.addError(`ERROR: Cuenta de efectivo por defecto no encontrada para establecimiento '${establecimiento.id}'. No se puede crear factura '${factData.id}'.`);
              continue;
            }
            cuentaId = cuentaEfectivo.id; 
            denominacionesEfectivo = primerPago.denominaciones_efectivo || { '10000': 1, '5000': 1 }; 
          } else {
            const medioPagoAsociado = await this.mediosPagoService.findByName(primerPago.metodo_pago, establecimiento.id);
            if (!medioPagoAsociado) {
              this.addError(`ERROR: Medio de pago '${primerPago.metodo_pago}' no encontrado para factura '${factData.id}'. Saltando.`);
              continue;
            }
            const cuentaBancaria = await this.cuentasBancariasService.findByMedioPagoId(medioPagoAsociado.id, establecimiento.id);
            if (!cuentaBancaria) {
                this.addError(`ERROR: No se encontró una cuenta bancaria asociada al medio de pago '${primerPago.metodo_pago}' para factura '${factData.id}'. Saltando.`);
                continue;
            }
            cuentaId = cuentaBancaria.id;
          }
          const usuarioCajero = await this.usuariosService.findOne(getMappedId(factData.usuarioCajeroId), establecimiento.id);
          if (!usuarioCajero) {
            this.addError(`ERROR: Usuario cajero no encontrado para factura '${factData.id}'. Saltando.`);
            continue;
          }

          const createFacturaAndPaymentDto: CreateFacturaAndPaymentDto = {
            pedido_id: pedido.id,
            establecimiento_id: establecimiento.id,
            
            numero_documento: cliente?.numero_documento || null,
            nombre_completo: cliente?.nombre_completo || null,
            correo_electronico: cliente?.correo_electronico || null,
            tipo_documento: cliente?.tipo_documento || null, 
            direccion: cliente?.direccion || null,
            telefono: cliente?.telefono || null,
            DV: cliente?.DV || null,
            descuentos: factData.descuentos || 0,
            propina: factData.propina || 0,
            notas: factData.notas || null,
            monto_pagado: primerPago.monto_pagado, 
            es_efectivo: esEfectivo,
            cuenta_id: cuentaId,
            denominaciones_efectivo: denominacionesEfectivo,
          };

          const newFactura = await this.facturasService.createFacturaAndPaymentForOrder( 
            createFacturaAndPaymentDto,
            usuarioCajero.id, 
            establecimiento.id 
          );
          idMap[factData.id] = newFactura.id;
          this.logger.log(`- Factura (${newFactura.id}) creada para pedido ${pedido.id}.`);
        } else {
          idMap[factData.id] = existingFactura.id;
          this.logger.log(`- Factura (${existingFactura.id}) ya existe.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar factura (${factData.id}): ${error.message}`);
      }
    }
  }

  async seedClientes(clientesData: any[]) {
    this.logger.log('--- Sembrando Clientes ---');
    for (const cliData of clientesData) {
      try {
        const mappedEstablecimientoId = getMappedId(cliData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(mappedEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para cliente '${cliData.nombre}'. Saltando.`);
          continue;
        }

        let existingCliente = await this.clientesService.findByTelefono(cliData.telefono, establecimiento.id);
        let currentMappedId = getMappedId(cliData.id);

        if (!existingCliente) {
          const createDto: CreateClienteDto = {
            ...cliData,
          };
          const newCliente = await this.clientesService.create(createDto, establecimiento.id);
          idMap[cliData.id] = newCliente.id;
          this.logger.log(`- Cliente '${cliData.nombre}' (${newCliente.id}) creado.`);
        } else {
          idMap[cliData.id] = existingCliente.id;
          this.logger.log(`- Cliente '${cliData.nombre}' (${existingCliente.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar cliente '${cliData.nombre}': ${error.message}`);
      }
    }
  }

  async seedCuentasBancarias(cuentasData: any[]) {
    this.logger.log('--- Sembrando Cuentas Bancarias ---');
    for (const cuentaData of cuentasData) {
      try {
        const realEstablecimientoId = getMappedId(cuentaData.establecimientoId);
        const establecimiento = await this.establecimientosService.findOne(realEstablecimientoId);

        if (!establecimiento) {
          this.addError(`ERROR: Establecimiento asociado no encontrado para cuenta bancaria '${cuentaData.nombre_banco}'. Saltando.`);
          continue;
        }

        let existingCuenta = await this.cuentasBancariasService.findByNumeroCuenta(cuentaData.numero_cuenta, establecimiento.id); 
        let currentMappedId = getMappedId(cuentaData.id);

        if (!existingCuenta) {
          const createDto: any = { 
            ...cuentaData,
            establecimiento_id: establecimiento.id,
            id: currentMappedId,
          };
          const newCuenta = await this.cuentasBancariasService.create(createDto, establecimiento.id);
          idMap[cuentaData.id] = newCuenta.id;
          this.logger.log(`- Cuenta bancaria '${newCuenta.nombre_banco}' (${newCuenta.id}) creada.`);
        } else {
          idMap[cuentaData.id] = existingCuenta.id;
          this.logger.log(`- Cuenta bancaria '${existingCuenta.nombre_banco}' (${existingCuenta.id}) ya existe. Usando ID existente.`);
        }
      } catch (error: any) {
        this.addError(`ERROR: Fallo al sembrar cuenta bancaria '${cuentaData.nombre_banco}': ${error.message}`);
      }
    }
  }
  async seedScenario(scenarioName: string, data: any) {
    this.logger.log(`=== Procesando Escenario '${scenarioName}'. ===`);
    this.errors = []; 
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (data.roles) {
        await this.seedRoles(data.roles);
      }
      if (data.establecimientos) {
        await this.seedEstablecimientos(data.establecimientos);
      }
      if (data.usuarios) {
        await this.seedUsuarios(data.usuarios);
      }
      if (data.establecimientos) { 
        await this.seedEstablecimientoConfiguracionPedido(data.establecimientos);
      }
      if (data.mediosPago) {
        await this.seedMediosPago(data.mediosPago);
      }
      if (data.categorias) {
        await this.seedCategorias(data.categorias);
      }
      if (data.mesas) {
        await this.seedMesas(data.mesas);
      }
      if (data.proveedores) {
        await this.seedProveedores(data.proveedores);
      }
      if (data.ingredientes) {
        await this.seedIngredientes(data.ingredientes);
      }
      if (data.productos) {
        await this.seedProductos(data.productos);
      }
      if (data.comprasIngredientes) {
        await this.seedComprasIngredientes(data.comprasIngredientes);
      }
      if (data.pedidos) {
        await this.seedPedidos(data.pedidos);
      }
      if (data.clientes) {
        await this.seedClientes(data.clientes);
      }
      if (data.cuentasBancarias) {
        await this.seedCuentasBancarias(data.cuentasBancarias);
      }
      await this.seedCierreCaja(data.establecimientos); 
      if (data.facturas) {
        await this.seedFacturas(data.facturas);
      }
      if (data.pagosAntiguos) {
        this.logger.log('--- Sembrando Pagos Antiguos (PagoEntity) ---');
        const pagoRepository = this.dataSource.getRepository(PagoEntity);
        const facturaRepository = this.dataSource.getRepository(FacturaEntity);
        const medioPagoRepository = this.dataSource.getRepository(MedioPagoEntity);
        const clienteRepository = this.dataSource.getRepository(ClienteEntity);

        for (const pagoData of data.pagosAntiguos) {
          try {
            const mappedPagoId = getMappedId(pagoData.id);
            const mappedFacturaId = getMappedId(pagoData.facturaId);
            const mappedMedioPagoId = pagoData.medioPagoId ? getMappedId(pagoData.medioPagoId) : null; 
            const mappedClienteId = pagoData.clienteId ? getMappedId(pagoData.clienteId) : null;

            const existingPago = await pagoRepository.findOne({ where: { id: mappedPagoId } });

            if (!existingPago) {
              const factura = await facturaRepository.findOne({ where: { id: mappedFacturaId } });
              if (!factura) {
                this.addError(`ERROR: Factura con ID "${pagoData.facturaId}" no encontrada para pago '${pagoData.id}'. Saltando.`);
                continue;
              }

              let medioPago: MedioPagoEntity | null = null;
              if (mappedMedioPagoId) {
                medioPago = await medioPagoRepository.findOne({ where: { id: mappedMedioPagoId } });
                if (!medioPago) {
                  this.addError(`ERROR: Medio de pago con ID "${mappedMedioPagoId}" no encontrado para pago '${pagoData.id}'. Saltando.`);
                  continue;
                }
              }

              let cliente: ClienteEntity | null = null;
              if (mappedClienteId) {
                cliente = await clienteRepository.findOne({ where: { id: mappedClienteId, establecimiento_id: factura.establecimiento_id } });
                if (!cliente) {
                  this.addError(`ERROR: Cliente con ID "${mappedClienteId}" no encontrado para pago '${pagoData.id}' en el establecimiento '${factura.establecimiento_id}'. Saltando.`);
                  continue;
                }
              }

              const newPago = new PagoEntity();
              newPago.id = mappedPagoId;
              newPago.factura_id = factura.id;
              newPago.establecimiento_id = factura.establecimiento_id; 
              newPago.monto_recibido = pagoData.monto_recibido; 
              newPago.fecha_hora_pago = pagoData.fecha_pago ? new Date(pagoData.fecha_pago) : new Date(); 
              newPago.referencia_transaccion = pagoData.referencia_transaccion || null; 
              newPago.denominaciones_efectivo = pagoData.denominaciones_efectivo || null; 
              newPago.cuenta_bancaria_id = pagoData.cuenta_bancaria_id ? getMappedId(pagoData.cuenta_bancaria_id) : null; 
              newPago.cierre_caja_id = pagoData.cierre_caja_id ? getMappedId(pagoData.cierre_caja_id) : null; 

              await pagoRepository.save(newPago);
              this.logger.log(`- Pago (${newPago.id}) para factura ${factura.id} creado.`);
            } else {
              this.logger.log(`- Pago (${existingPago.id}) ya existe.`);
            }
          } catch (error: any) {
            this.addError(`ERROR: Fallo al sembrar pago antiguo (${pagoData.id}): ${error.message}`);
          }
        }
      }

      this.logger.log(`=== Escenario '${scenarioName}' procesado. ===`);
      await queryRunner.commitTransaction();
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.addError(`ERROR: Fallo crítico en el escenario '${scenarioName}': ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async seed() {
    this.logger.log('\n--- Iniciando proceso de seeding ---');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const seedData = require('./seed-data.json'); 
      await this.seedScenario(seedData[0].name, seedData[0]); 
      this.logger.log('\n--- Proceso de seeding finalizado exitosamente (con errores individuales logeados). ---');
    } catch (error: any) {
      this.logger.error(`\n--- ERROR CRÍTICO DURANTE EL PROCESO DE SEEDING: ${error.message} ---`);
    } finally {
      await queryRunner.release();
      this.logger.log('\n--- Conexión de seeder liberada. ---');
      if (this.errors.length > 0) {
        this.logger.error('\n========================================');
        this.logger.error('ERRORES RESUMIDOS DEL PROCESO DE SEEDING:');
        this.logger.error('========================================');
        this.errors.forEach((err, index) => this.logger.error(`${index + 1}. ${err}`));
        this.logger.error('========================================');
      }
      this.logger.log('DEBUG: Estado final del idMap: ');
      this.logger.log(JSON.stringify(idMap, null, 2));
    }
  }
}

