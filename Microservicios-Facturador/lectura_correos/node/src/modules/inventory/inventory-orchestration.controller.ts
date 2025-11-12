import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus, 
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { InventoryOrchestrationService } from './inventory-orchestration.service';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@UseGuards(JwtAuthGuard) 
@Controller('api/inventory-orchestration') 
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class InventoryOrchestrationController {
  constructor(private readonly orchestrationService: InventoryOrchestrationService) {}

  @Post('create-entry') 
  @HttpCode(HttpStatus.CREATED)
  async createInventoryEntry(
    @Body() dto: CreateInventoryEntryDto,
    @TenantId() tenantId: string, 
  ) {
    return this.orchestrationService.createInventoryEntry(dto, tenantId); 
  }
}