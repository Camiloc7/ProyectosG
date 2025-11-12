import { ApiProperty } from '@nestjs/swagger';
import { PaginacionDto } from 'src/common/dto/paginacion.dto';

class VentasPorMedioPagoItem {
  @ApiProperty({ description: 'Nombre del medio de pago' })
  medio: string;

  @ApiProperty({ description: 'Total de ventas para este medio de pago' })
  total: number;
}

class VentasPorCategoriaItem {
  @ApiProperty({ description: 'Nombre de la categoría' })
  categoria: string;

  @ApiProperty({ description: 'Total de ventas para esta categoría' })
  total: number;
}

class TopProductosVendidosItem {
  @ApiProperty({ description: 'Nombre del producto' })
  nombre: string;

  @ApiProperty({ description: 'Cantidad vendida del producto' })
  cantidad: number;

  @ApiProperty({ description: 'Total de ventas del producto' })
  total: number;
}


class VentasPorDiaHora {
  @ApiProperty({ description: 'Día de la semana (1=domingo, 2=lunes, etc.)' })
  diaSemana: number;
  @ApiProperty({ description: 'Hora del día (0-23)' })
  horaDia: number;
  @ApiProperty({ description: 'Total de ventas en esa hora' })
  totalVentas: number;
}

class VentasPorDiaItem {
  @ApiProperty({ description: 'Fecha del día (YYYY-MM-DD)' })
  fecha: string;
  @ApiProperty({ description: 'Total de ventas para esa fecha' })
  total: number;
}


class PedidosAsociadosItem {
  @ApiProperty({ description: 'ID del pedido asociado a la factura' })
  pedidoId: string;

  @ApiProperty({ description: 'Monto aplicado del pedido a esta factura' })
  montoAplicado: number;
}

class DetalleFacturaItem {
  @ApiProperty({ description: 'ID de la factura' })
  id: string;

  @ApiProperty({ description: 'Fecha y hora de emisión de la factura (en hora local de Colombia)' })
  fecha_hora_factura: string;

  @ApiProperty({ description: 'Total de la factura' })
  total_factura: number;

  @ApiProperty({ description: 'Nombre completo del cajero que emitió la factura' })
  usuarioCajero: string;

  @ApiProperty({ description: 'Tipo de factura (TOTAL o PARCIAL)' })
  tipo_factura: string;

  @ApiProperty({ type: [PedidosAsociadosItem], description: 'Detalle de los pedidos asociados a esta factura' })
  pedidosAsociados: PedidosAsociadosItem[];
}

export class ReporteVentasDto {
  @ApiProperty({ description: 'Fecha y hora de generación del reporte' })
  fechaReporte: string;

  @ApiProperty({ description: 'Filtros aplicados para generar el reporte' })
  filtrosAplicados: any;

  @ApiProperty({ description: 'Resumen financiero de las ventas' })
  resumenFinanciero: {
    totalVentas: number;
    totalImpuestos: number;
    totalDescuentos: number;
    totalPropina: number;
    totalNeto: number;
  };

  @ApiProperty({ type: [VentasPorMedioPagoItem], description: 'Ventas desglosadas por medio de pago' })
  ventasPorMedioPago: VentasPorMedioPagoItem[];

  @ApiProperty({ type: [VentasPorCategoriaItem], description: 'Ventas desglosadas por categoría de producto' })
  ventasPorCategoria: VentasPorCategoriaItem[];

  @ApiProperty({ type: [TopProductosVendidosItem], description: 'Lista de los productos más vendidos' })
  topProductosVendidos: TopProductosVendidosItem[];

  @ApiProperty({ type: [VentasPorDiaHora], description: 'Ventas agrupadas por día de la semana y hora del día' })
  ventasPorDiaHora: VentasPorDiaHora[];

  @ApiProperty({ type: [VentasPorDiaItem], description: 'Ventas agrupadas por día (resumen diario)' })
  ventasPorDia: VentasPorDiaItem[];

  @ApiProperty({
    type: PaginacionDto,
    description: 'Detalle de cada factura incluida en el reporte con información de paginación',
  })
  detalleFacturas: PaginacionDto<DetalleFacturaItem>;
}
