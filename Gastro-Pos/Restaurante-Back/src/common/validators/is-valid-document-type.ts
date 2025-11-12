import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { DOCUMENTO_TYPES } from 'src/modules/clientes/tipos-documento';
@ValidatorConstraint({ async: false })
export class IsValidDocumentTypeConstraint implements ValidatorConstraintInterface {
  validate(tipoDocumento: any) {
    if (!tipoDocumento) {
      return true; 
    }
    const found = DOCUMENTO_TYPES.find(doc => 
      doc.enum === tipoDocumento || 
      doc.nombre === tipoDocumento || 
      doc.codigo === tipoDocumento
    );

    return !!found;
  }

  defaultMessage() {
    return 'El tipo de documento es inválido.';
  }
}

export function IsValidDocumentType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDocumentTypeConstraint,
    });
  };
}