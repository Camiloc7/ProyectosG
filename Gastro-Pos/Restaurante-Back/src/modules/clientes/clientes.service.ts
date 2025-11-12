import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { ClienteEntity } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { v4 as uuidv4 } from 'uuid';
import { DOCUMENTO_TYPES, TipoDocumento } from './tipos-documento';
import axios from 'axios';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(ClienteEntity) 
    private readonly clienteRepository: Repository<ClienteEntity>,
  ) {}

  private getDocumentoInfo(tipoDocumentoInput: string) {
    return DOCUMENTO_TYPES.find(doc =>
      doc.enum === tipoDocumentoInput ||
      doc.nombre === tipoDocumentoInput ||
      doc.codigo === tipoDocumentoInput
    );
  }

  async findByQuery(query: string, establecimientoId: string): Promise<ClienteEntity[]> {
    return await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.establecimiento_id = :establecimientoId', { establecimientoId })
      .andWhere(
        '(LOWER(cliente.nombre_completo) LIKE LOWER(:query) OR cliente.telefono = :telefono OR LOWER(cliente.direccion) LIKE LOWER(:query))',
        { query: `%${query}%`, telefono: query }
      )
      .getMany();
  }

  async create(createClienteDto: CreateClienteDto, establecimientoId: string): Promise<ClienteEntity> {
    const { numero_documento, tipo_documento, telefono } = createClienteDto;
    
    const tipoDocInfo = tipo_documento ? this.getDocumentoInfo(tipo_documento) : null;

    if (numero_documento && tipoDocInfo) {
      const existingByDocument = await this.clienteRepository.findOne({
        where: { establecimiento_id: establecimientoId, numero_documento, tipo_documento: tipoDocInfo.nombre },
      });
      if (existingByDocument) {
        throw new ConflictException(`Ya existe un cliente con el documento ${tipoDocInfo.nombre}-${numero_documento} en este establecimiento.`);
      }
    }
    if (telefono) {
      const existingByPhone = await this.clienteRepository.findOne({
        where: { establecimiento_id: establecimientoId, telefono },
      });
      if (existingByPhone) {
        throw new ConflictException(`Ya existe un cliente con el teléfono ${telefono} en este establecimiento.`);
      }
    }

    const newCliente = this.clienteRepository.create({
      ...createClienteDto,
      tipo_documento: tipoDocInfo ? tipoDocInfo.nombre : null,
      tipo_documento_codigo: tipoDocInfo ? tipoDocInfo.codigo : null,
      id: uuidv4(), 
      establecimiento_id: establecimientoId, 
    });
    return await this.clienteRepository.save(newCliente);
  }

  async findByTelefono(telefono: string, establecimientoId: string): Promise<ClienteEntity | null> {
    return await this.clienteRepository.findOne({ where: { telefono, establecimiento_id: establecimientoId } });
  }

  async getOrCreateCliente(createClienteDto: CreateClienteDto, establecimientoId: string): Promise<ClienteEntity> {
    const { numero_documento, tipo_documento, telefono } = createClienteDto;
    
    const tipoDocInfo = tipo_documento ? this.getDocumentoInfo(tipo_documento) : null;
        if (numero_documento && tipoDocInfo) {
      const existingCliente = await this.clienteRepository.findOne({
        where: {
          establecimiento_id: establecimientoId,
          numero_documento,
          tipo_documento: tipoDocInfo.nombre,
        },
      });
      if (existingCliente) {
        return existingCliente;
      }
    }
    const clienteToCreate: Partial<ClienteEntity> = {
      establecimiento_id: establecimientoId,
      nombre_completo: createClienteDto.nombre_completo || 'Cliente Genérico',
      correo_electronico: createClienteDto.correo_electronico || null,
      direccion: createClienteDto.direccion || null,
      DV: createClienteDto.DV || null,
    };
    
    if (tipoDocInfo) {
      clienteToCreate.tipo_documento = tipoDocInfo.nombre;
      clienteToCreate.tipo_documento_codigo = tipoDocInfo.codigo;
    } else {
      const ccInfo = DOCUMENTO_TYPES.find(doc => doc.enum === TipoDocumento.CC);
      if (ccInfo) {
        clienteToCreate.tipo_documento = ccInfo.nombre;
        clienteToCreate.tipo_documento_codigo = ccInfo.codigo;
      }
    }
    if (!numero_documento) {
      clienteToCreate.numero_documento = uuidv4();
    } else {
      clienteToCreate.numero_documento = numero_documento;
    }
    if (!telefono) {
      clienteToCreate.telefono = `ANONIMO-TEL-${uuidv4().substring(0, 8)}`;
    } else {
      clienteToCreate.telefono = telefono;
    }

    const newCliente = this.clienteRepository.create(clienteToCreate);
    return await this.clienteRepository.save(newCliente);
  }

  async findOne(id: string, establecimientoId: string): Promise<ClienteEntity> {
    const cliente = await this.clienteRepository.findOne({
      where: { id, establecimiento_id: establecimientoId },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado en el establecimiento "${establecimientoId}".`);
    }
    return cliente;
  }

  async findAll(establecimientoId: string): Promise<ClienteEntity[]> {
    return await this.clienteRepository.find({
      where: { establecimiento_id: establecimientoId },
      order: { nombre_completo: 'ASC' },
    });
  }

  async update(id: string, updateClienteDto: UpdateClienteDto, establecimientoId: string): Promise<ClienteEntity> {
    const cliente = await this.findOne(id, establecimientoId);
    
    const { numero_documento, tipo_documento, telefono, ...restOfDto } = updateClienteDto;
    
    const tipoDocInfo = tipo_documento ? this.getDocumentoInfo(tipo_documento) : null;
    
    if (numero_documento && tipoDocInfo && (numero_documento !== cliente.numero_documento || tipoDocInfo.nombre !== cliente.tipo_documento)) {
      const existingByDocument = await this.clienteRepository.findOne({
        where: { establecimiento_id: establecimientoId, numero_documento, tipo_documento: tipoDocInfo.nombre },
      });
      if (existingByDocument && existingByDocument.id !== id) {
        throw new ConflictException(`Ya existe otro cliente con el documento ${tipoDocInfo.nombre}-${numero_documento} en este establecimiento.`);
      }
      cliente.numero_documento = numero_documento;
      cliente.tipo_documento = tipoDocInfo.nombre;
      cliente.tipo_documento_codigo = tipoDocInfo.codigo;
    }
    
    if (telefono && telefono !== cliente.telefono) {
      const existingByPhone = await this.clienteRepository.findOne({
        where: { establecimiento_id: establecimientoId, telefono },
      });
      if (existingByPhone && existingByPhone.id !== id) {
        throw new ConflictException(`Ya existe otro cliente con el teléfono ${telefono} en este establecimiento.`);
      }
      cliente.telefono = telefono;
    }

    Object.assign(cliente, restOfDto); 
    
    return await this.clienteRepository.save(cliente);
  }

  async remove(id: string, establecimientoId: string): Promise<DeleteResult> {
    await this.findOne(id, establecimientoId);
    
    const result = await this.clienteRepository.delete({ id, establecimiento_id: establecimientoId });
    if (result.affected === 0) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado para eliminar en el establecimiento "${establecimientoId}".`);
    }
    return result;
  }

  
    async fetchClientFromExternalApi(
          tipoDocumento: string,
          numeroDocumento: string,
          establecimiento: EstablecimientoEntity,
      ): Promise<{ nombre?: string; email?: string } | null> {
          const apiKey = establecimiento.api_key;
          const nit = establecimiento.nit;
          const apiUrl = 'https://gestionhumana.qualitysoftservices.com/index.php/api/cliente/recuperar-informacion';
  
          const requestBody = {
              tipo_documento: tipoDocumento,
              numero_documento: numeroDocumento,
          };
          try {
              const response = await axios.post(apiUrl, requestBody, {
                  headers: {
                      'api-key': apiKey,
                      'nit': nit,
                  },
              });
              const data = response.data;  
              if (!data || !data.dataApi) {
                  console.error('La API externa no devolvió datos válidos.');
                  return null;
              }
              const clientData = data.dataApi;
              const nombreCompleto = [
                  clientData.primerNombre,
                  clientData.segundoNombre,
                  clientData.primerApellido,
                  clientData.segundoApellido
              ].filter(Boolean).join(' ');
              return {
                  nombre: nombreCompleto,
                  email: undefined
              };
  
          } catch (error: any) {
              console.error('[fetchClientFromExternalApi] Error al consultar la API externa:', error.message);
              if (axios.isAxiosError(error) && error.response) {
                  console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
              }
              return null;
          }
      }
}
