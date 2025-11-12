// src/modules/accounting-causation/accounting-causation.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CausationRule } from '../supplier-causation/entities/causation-rule.entity';

@Injectable()
export class AccountingCausationService {
  private readonly logger = new Logger(AccountingCausationService.name);

  constructor(
    @InjectRepository(CausationRule)
    private causationRulesRepository: Repository<CausationRule>,
  ) {}

  private getOperandValue(source: 'invoice_field' | 'fixed_value', data: any, dbColumn?: string | null, fixedValue?: number | null, ruleId?: string): number {
    let value: any;
    let sourceName: string;

    if (source === 'fixed_value') {
      value = fixedValue;
      sourceName = `valor fijo '${fixedValue}'`;
    } else {
      if (typeof dbColumn !== 'string' || !dbColumn) {
        this.logger.error(`El nombre de la columna para el operando de campo de documento es inválido o nulo para la regla ${ruleId || 'N/A'}.`);
        return 0; 
      }
      value = data[dbColumn];
      sourceName = `campo '${dbColumn}'`;
    }

    if (value === undefined || value === null) {
      this.logger.warn(`El operando (${sourceName}) para la regla ${ruleId || 'N/A'} no se encontró o es nulo/indefinido. Se asumirá 0 para la operación.`);
      return 0;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      this.logger.error(`El operando (${sourceName}) para la regla ${ruleId || 'N/A'} no es un número válido ('${value}'). Se asumirá 0 para la operación.`);
      return 0;
    }

    return numericValue;
  }

  async applyCausationRules(
    documentData: any,
    tenantId: string,
    electronicDocumentType: string,
    targetTable: string,
    processType: string,
  ): Promise<void> {
    this.logger.log(`Iniciando aplicación de reglas de causación para [${electronicDocumentType} - ${targetTable} - ${processType}] para el tenant: ${tenantId}`);

    const rules = await this.causationRulesRepository.find({
      where: {
        electronicDocumentType,
        targetTable,
        processType,
        tenant_id: tenantId, 
      },
    });

    if (!rules || rules.length === 0) {
      this.logger.log(`No se encontraron reglas de causación aplicables para [${electronicDocumentType}].`);
      return;
    }

    for (const rule of rules) {
      this.logger.verbose(`Procesando regla: ID=${rule.id}, PUC=${rule.pucCode}, Op=${rule.operation}`);
      let calculatedValue: number | null = null;

      try {
        const firstOperandValue = this.getOperandValue(
          'invoice_field',
          documentData,
          rule.firstOperandDbColumn,
          null,
          rule.id
        );

        let secondOperandValue: number;

        if (rule.secondOperandSource === 'fixed_value') {
          secondOperandValue = this.getOperandValue(
            'fixed_value',
            documentData,
            null, 
            rule.secondOperandValue,
            rule.id
          );
        } else {
          secondOperandValue = this.getOperandValue(
            'invoice_field',
            documentData,
            rule.secondOperandDbColumn,
            null,
            rule.id
          );
        }

        switch (rule.operation) {
          case '+':
            calculatedValue = firstOperandValue + secondOperandValue;
            break;
          case '-':
            calculatedValue = firstOperandValue - secondOperandValue;
            break;
          case '*':
            calculatedValue = firstOperandValue * secondOperandValue;
            break;
          case '/':
            if (secondOperandValue === 0) {
              this.logger.warn(`División por cero detectada para la regla ${rule.id}. Resultado establecido a 0.`);
              calculatedValue = 0;
            } else {
              calculatedValue = firstOperandValue / secondOperandValue;
            }
            break;
          case '%':
            calculatedValue = firstOperandValue * (secondOperandValue / 100);
            break;
          case '=':
            calculatedValue = secondOperandValue;
            break;
          default:
            this.logger.error(`Operación desconocida o no implementada '${rule.operation}' para la regla ${rule.id}.`);
            throw new BadRequestException(`Operación no válida: ${rule.operation}`);
        }

        if (calculatedValue !== null && !isNaN(calculatedValue)) {
          this.logger.log(`Regla ${rule.id} aplicada: PUC=${rule.pucCode}, Tipo=${rule.accountingType}, Valor=${calculatedValue.toFixed(2)}`);

          // Aquí llamarías a tu servicio de contabilidad para crear el asiento real
          // await this.accountingEntryService.createEntry({
          //   pucCode: rule.pucCode,
          //   value: parseFloat(calculatedValue.toFixed(2)),
          //   accountingType: rule.accountingType,
          //   documentId: documentData.id,
          //   tenantId: tenantId,
          //   ruleId: rule.id,
          // });
        } else {
          this.logger.error(`El valor calculado para la regla ${rule.id} es nulo o NaN. No se generará asiento.`);
        }
      } catch (error) {
        this.logger.error(`Error al procesar la regla ${rule.id}: ${error.message}`, error.stack);
      }
    }
    this.logger.log(`Finalizada aplicación de reglas de causación para [${electronicDocumentType}].`);
  }
}