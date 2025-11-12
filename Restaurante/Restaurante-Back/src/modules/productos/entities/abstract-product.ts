import { OpcionValor } from './opcion-valor.entity';
import { IngredienteEntity } from '../../ingredientes/entities/ingrediente.entity';
import { PedidoItemEntity } from '../../pedidos/entities/pedido-item.entity';

export abstract class AbstractProduct {
  abstract calcularPrecio(pedidoItem: PedidoItemEntity, opciones: OpcionValor[]): number;
  abstract getIngredientes(pedidoItem: PedidoItemEntity, opciones: OpcionValor[]): { ingrediente: IngredienteEntity, cantidad: number }[];
}