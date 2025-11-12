import { ApiProperty } from '@nestjs/swagger';

export class ProductListItemDto {
  @ApiProperty({ description: 'ID único del producto', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nombre del producto' })
  nombre: string;

  @ApiProperty({ description: 'Precio del producto', type: 'number', format: 'float' })
  precio: number; 

  @ApiProperty({ description: 'Nombre de la categoría a la que pertenece el producto' })
  categoria: string;
}