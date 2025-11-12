import xml.etree.ElementTree as ET
import re
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

NAMESPACES = {
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'sts': 'urn:dian:gov:co:facturaelectronica:Structures-2-1',
    'ns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    'ds': 'http://www.w3.org/2000/09/xmldsig#',
    'xades': 'http://uri.etsi.org/01903/v1.3.2#',
    'xades141': 'http://uri.etsi.org/01903/v1.4.1#'
}

def clean_and_parse_xml_string(xml_string: str) -> Optional[ET.Element]:
    if not xml_string or not xml_string.strip():
        logger.warning("Se recibió cadena XML vacía o solo espacios.")
        return None
    cleaned_xml_string = re.sub(r'[^\x09\x0A\x0D\x20-\x7E\x80-\xFF]+', ' ', xml_string)
    try:
        return ET.fromstring(cleaned_xml_string)
    except ET.ParseError as e:
        logger.error(f"Error al parsear XML: {e}")
        return None

def get_xml_text(element, path, namespaces):
    node = element.find(path, namespaces)
    return node.text.strip() if node is not None and node.text else None

def get_xml_float(element, path, namespaces):
    text_value = get_xml_text(element, path, namespaces)
    if text_value is None:
        return None
    try:
        cleaned_value = text_value.replace('.', '')
        if ',' in text_value:
            cleaned_value = text_value.replace('.', '').replace(',', '.')
        else:
            cleaned_value = re.sub(r'[^\d.]', '', text_value)
            
        return float(cleaned_value)
    except ValueError:
        logger.warning(f"No se pudo convertir '{text_value}' a float ({path})")
        return None

def get_xml_date(element, path, namespaces):
    text_value = get_xml_text(element, path, namespaces)
    try:
        return datetime.strptime(text_value, '%Y-%m-%d').date() if text_value else None
    except ValueError:
        logger.warning(f"Fecha inválida: '{text_value}' ({path})")
        return None

def extract_nested_invoice_xml(zip_xml_content: bytes) -> Optional[str]:
    try:
        xml_string = zip_xml_content.decode('utf-8')
        if not xml_string.strip():
            logger.warning("Contenido XML decodificado está vacío.")
            return None

        root = clean_and_parse_xml_string(xml_string)
        if root is None:
            return None

        desc_node = root.find('.//cac:Attachment/cac:ExternalReference/cbc:Description', NAMESPACES)
        if desc_node is not None and desc_node.text:
            return desc_node.text
        
        if any(tag in xml_string for tag in ['<Invoice', '<FacturaElectronica', '<DianExtensions>']):
            return xml_string
    except Exception as e:
        logger.error(f"Error al extraer XML anidado: {e}", exc_info=True)
    return None

def parse_invoice_xml(xml_content: str) -> Optional[Dict[str, Any]]:
    if not xml_content or not xml_content.strip():
        logger.warning("Contenido XML vacío, no se procesará.")
        return None

    root = clean_and_parse_xml_string(xml_content)
    if root is None:
        logger.error("No se pudo obtener la raíz XML, contenido inválido.")
        return None

    try:
        data = {
            'cufe': get_xml_text(root, './/cbc:UUID', NAMESPACES),
            'numero_factura': get_xml_text(root, './/cbc:ID', NAMESPACES),
            'fecha_emision': get_xml_date(root, './/cbc:IssueDate', NAMESPACES),
            'hora_emision': get_xml_text(root, './/cbc:IssueTime', NAMESPACES),
            'moneda': get_xml_text(root, './/cbc:DocumentCurrencyCode', NAMESPACES),
            'monto_subtotal': get_xml_float(root, './/cac:LegalMonetaryTotal/cbc:LineExtensionAmount', NAMESPACES),
            'monto_total': get_xml_float(root, './/cac:LegalMonetaryTotal/cbc:PayableAmount', NAMESPACES),
            'fecha_vencimiento': get_xml_date(root, './/cac:PaymentMeans/cbc:PaymentDueDate', NAMESPACES),
            'metodo_pago': get_xml_text(root, './/cac:PaymentMeans/cbc:PaymentMeansCode', NAMESPACES),
        }

        supplier = root.find('.//cac:AccountingSupplierParty/cac:Party', NAMESPACES)
        if supplier:
            data['nombre_proveedor'] = get_xml_text(supplier, './/cac:PartyLegalEntity/cbc:RegistrationName', NAMESPACES) or \
                                       get_xml_text(supplier, './/cac:PartyName/cbc:Name', NAMESPACES)
            data['nit_proveedor'] = get_xml_text(supplier, './/cac:PartyTaxScheme/cbc:CompanyID', NAMESPACES)
            data['email_proveedor'] = get_xml_text(supplier, './/cac:Contact/cbc:ElectronicMail', NAMESPACES)

        customer = root.find('.//cac:AccountingCustomerParty/cac:Party', NAMESPACES)
        if customer:
            data['nombre_cliente'] = get_xml_text(customer, './/cac:PartyLegalEntity/cbc:RegistrationName', NAMESPACES) or \
                                     get_xml_text(customer, './/cac:PartyName/cbc:Name', NAMESPACES)
            data['nit_cliente'] = get_xml_text(customer, './/cac:PartyTaxScheme/cbc:CompanyID', NAMESPACES)
            data['correo_cliente_asociado'] = get_xml_text(customer, './/cac:Contact/cbc:ElectronicMail', NAMESPACES)

        total_tax = 0.0
        for node in root.findall('.//cac:TaxTotal', NAMESPACES):
            val = get_xml_float(node, './/cbc:TaxAmount', NAMESPACES)
            if val:
                total_tax += val
        data['monto_impuesto'] = total_tax if total_tax > 0 else None

        data['items'] = []
        for line in root.findall('.//cac:InvoiceLine', NAMESPACES):
            data['items'].append({
                'cantidad': get_xml_float(line, './/cbc:InvoicedQuantity', NAMESPACES),
                'descripcion': get_xml_text(line, './/cac:Item/cbc:Description', NAMESPACES),
                'valor_unitario': get_xml_float(line, './/cac:Price/cbc:PriceAmount', NAMESPACES),
                'valor_total': get_xml_float(line, './/cbc:LineExtensionAmount', NAMESPACES),
            })

        data['texto_crudo_xml'] = xml_content
        return data
    except Exception as e:
        logger.error(f"Error al parsear XML: {e}", exc_info=True)
        return None
