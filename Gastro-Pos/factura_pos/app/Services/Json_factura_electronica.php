<?php

namespace App\Services;

date_default_timezone_set('America/Bogota');

class Json_factura_electronica
{
    public function build2(array $data): string
    {
        
        $impuestos = $this->procesarFactura($data); 
        $tax_totals = $impuestos['tax_totals'];
        $invoice_lines = $impuestos['invoice_lines'];

        $subtotal = (float)$data['subtotal']; // subtotal numérico
        $totalImpuestos = 0.0;

        foreach ($tax_totals as $tax) {
            $totalImpuestos += (float)$tax['tax_amount'];
        }

        $total = number_format($subtotal + $totalImpuestos, 2, '.', '');
        $subtotal = number_format($subtotal, 2, '.', '');


        $payload = [
            "number" => $data['number'],
            "type_document_id" => 1,
            "date" => date('Y-m-d'),
            "time" => date('H:i:s'),
            "postal_zone_code" => $data['postal_zone_code'],
            "resolution_number" => $data['resolution_number'],
            "prefix" => $data['prefix'],
            "notes" => "QUALITY SOFT SERVICES",
            "sendmail" => false,
            "sendmailtome" => false,
            "foot_note" => "QUALITY SOFT SERVICES",
            "software_manufacturer" => [
                "name" => "QUALITY SOFT SERVICES",
                "business_name" => "QUALITY SOFT SERVICES",
                "software_name" => "GASTRO-POS"
            ],
            "buyer_benefits" => [
                "code" => $data['benefits_code'],
                "name" => $data['benefits_name'],
                "points" => (string) $data['benefits_points']
            ],
            "cash_information" => [
                "plate_number" => $data['plate_number'],
                "location" => $data['location'],
                "cashier" => $data['cashier'],
                "cash_type" => $data['cash_type'],
                "sales_code" => (string) $data['sales_code'],
                "subtotal" => $subtotal
            ],
            "customer" => [
                "identification_number" => $data['identification_number'],
                "dv" => (string) $data['customer_dv'],
                "name" => $data['customer_name'],
                "phone" => (string) $data['customer_phone'],
                "address" => $data['customer_address'],
                "email" => $data['customer_email'],
                "merchant_registration" => (string) $data['customer_merchant_registration'],
                "type_document_identification_id" => $data['customer_type_document_identification_id'],
                "type_organization_id" => $data['customer_type_organization_id'],
                "type_liability_id" => 117,
                "municipality_id" => $data['customer_municipality_id'],
                "type_regime_id" => $data['customer_type_regime_id']
            ],
            "payment_form" => [
                "payment_form_id" => $data['payment_form_id'],
                "payment_method_id" => $data['payment_method_id'],
                "payment_due_date" => $data['payment_due_date'],
                "duration_measure" => $data['duration_measure']
            ],
             "allowance_charges" => [
                [
                    "discount_id" => "11",
                    "charge_indicator" => false,
                    "allowance_charge_reason" => $datos->allowance_charge_reason,
                    "amount" => $datos->amount_dis,
                    "base_amount" => $datos->subtotalaiu
                ]
            ],
            "legal_monetary_totals" => [
                "line_extension_amount" => $subtotal,
                "tax_exclusive_amount" => $subtotal,
                "tax_inclusive_amount" => $total,
                "payable_amount" => $total
            ],
            "tax_totals" => $tax_totals,
            "invoice_lines" => $invoice_lines
        ];

        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

      

     public function build(array $data): string
    {
        $impuestos = $this->procesarFactura($data);
        $tax_totals = $impuestos['tax_totals'];
        $invoice_lines = $impuestos['invoice_lines'];

        $subtotal = (float)$data['subtotal']; // subtotal numérico
        $totalImpuestos = 0.0;

        foreach ($tax_totals as $tax) {
            $totalImpuestos += (float)$tax['tax_amount'];
        }

        $total = number_format($subtotal + $totalImpuestos, 2, '.', '');
        $subtotal = number_format($subtotal, 2, '.', '');


        $jsonArray = [
            "number" => $data['number'],
            //"number" => 991000001,
            "type_document_id" => 1,
            "date" => date('Y-m-d'),
            "time" => date('H:i:s'),
            "notes" => "QUALITY SOFT SERVICES",
            // "noteAIU" => $data['noteAIU'],
            "sendmail" => false,
            "prefix" => $data['prefix'],
            "resolution_number" =>$data['resolution_number'],
             "customer" => [
                "identification_number" => $data['identification_number'],
                "dv" => (string) $data['customer_dv'],
                "name" => $data['customer_name'],
                "phone" => (string) $data['customer_phone'],
                "address" => $data['customer_address'],
                "email" => $data['customer_email'],
                "merchant_registration" => (string) $data['customer_merchant_registration'],
                "type_document_identification_id" => $data['customer_type_document_identification_id'],
                "type_organization_id" => $data['customer_type_organization_id'],
                "type_liability_id" => 117,
                "municipality_id" => $data['customer_municipality_id'],
                "type_regime_id" => $data['customer_type_regime_id']
            ],
            "payment_form" => [
                "payment_form_id" => $data['payment_form_id'],
                "payment_method_id" => $data['payment_method_id'],
                "payment_due_date" => $data['payment_due_date'],
                "duration_measure" => $data['duration_measure']
            ],
            // "allowance_charges" => [
            //     [
            //         "discount_id" => "11",
            //         "charge_indicator" => false,
            //         "allowance_charge_reason" => $datos->allowance_charge_reason,
            //         "amount" => $datos->amount_dis,
            //         "base_amount" => $datos->subtotalaiu
            //     ]
            // ],
            "legal_monetary_totals" => [
                "line_extension_amount" => $subtotal,
                "tax_exclusive_amount" => $subtotal,
                "tax_inclusive_amount" => $total,
                "payable_amount" => $total
            ],
            "tax_totals" => $tax_totals,
            "invoice_lines" => $invoice_lines
        ];

        return json_encode($jsonArray, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    

    private function obtenerTaxtotals($data)
    {
        $tax_totals = [];

        if (!empty($data['iva'])) {
            $tax_totals[] = (object)[
                "tax_id" => 1,
                "tax_amount" => number_format($data['taxAmountIva'], 2, '.', ''),
                "percent" => "19.00",
                "taxable_amount" => number_format($data['subtotal'], 2, '.', ''),
                'code' => 'IVA',
            ];
        }

        if (!empty($data['ic'])) {
            $tax_totals[] = (object)[
                "tax_id" => 2,
                "tax_amount" => number_format($data['taxAmountIc'], 2, '.', ''),
                "percent" => "6.00",
                "taxable_amount" => number_format($data['subtotal'], 2, '.', ''),
                'code' => 'IC',
            ];
        }

        if (!empty($data['inc'])) {
            $tax_totals[] = (object)[
                "tax_id" => 4,
                "tax_amount" => number_format($data['taxAmountInc'], 2, '.', ''),
                "percent" => "8.00",
                "taxable_amount" => number_format($data['subtotal'], 2, '.', ''),
                'code' => 'INC',
                ];
        }

        return $tax_totals;
    }

    private function obtenerInvoices($data)
    {
        $tax_totals = [];

        if (!empty($data['iva'])) {
            $tax_totals[] = (object)[
                'tax_id' => 1,
                'tax_amount' =>  number_format($data['taxAmountIva'],2,'.',''),
                'percent' => '19.00',
                'taxable_amount' => $data['subtotal'],
                'code' => 'IVA',
            ];
        }

        if (!empty($data['ic'])) {
            $tax_totals[] = (object)[
                'tax_id' => 2,
                'tax_amount' => number_format($data['taxAmountIc'], 2, '.', ''),
                'percent' => '6.00',
                'taxable_amount' => $data['subtotal'],
                'code' => 'IC',
                
            ];
        }

        if (!empty($data['inc'])) {
            $tax_totals[] = (object)[
                'tax_id' => 4,
                'tax_amount' =>  number_format($data['taxAmountInc'],2,'.',''),
                'percent' => '8.00',
                'taxable_amount' => $data['subtotal'],
                'code' => 'INC',
            ];
        }

        // Total de impuestos
        $totalImpuestos = array_sum(array_column($tax_totals, 'tax_amount'));

        // Construir la única línea con todos los impuestos aplicados
        $invoice_line = [
            'unit_measure_id' => 70,
            'invoiced_quantity' => 1,
            'line_extension_amount' => $data['subtotal'],
            'free_of_charge_indicator' => false,
            'description' => 'Factura POS',
            'notes' => 'Quality Soft Services',
            'code' => 'POS DESDE GASTRO-POS',
            'type_item_identification_id' => 4,
            'base_quantity' => 1,
            'tax_totals' => $tax_totals,
            'price_amount' => $data['subtotal'] + $totalImpuestos,
        ];

        return [$invoice_line];
    }

    public function procesarFactura(array $data)
    {
        $items = $data['items'] ?? [];

        $invoice_lines = [];
        $tax_totals = [
            'iva' => ['taxable_amount' => 0, 'tax_amount' => 0, 'percent' => 19],
            'ic' => ['taxable_amount' => 0, 'tax_amount' => 0, 'percent' => 8],
            'inc' => ['taxable_amount' => 0, 'tax_amount' => 0, 'percent' => 4],
        ];

        foreach ($items as $index => $item) {
            $cantidad = (float)($item['cantidad'] ?? 1);
            $precioUnitario = (float)($item['precio'] ?? 0);
            $subtotal = $cantidad * $precioUnitario;

            $valorIva = 0;
            $valorIc = 0;
            $valorInc = 0;

            $lineTaxes = [];

            if (!empty($item['iva'])) {
                $valorIva = $subtotal * 0.19;
                $tax_totals['iva']['taxable_amount'] += $subtotal;
                $tax_totals['iva']['tax_amount'] += $valorIva;

                $lineTaxes[] = [
                    "tax_id" => 1,
                    "tax_amount" => number_format($valorIva, 2, '.', ''),
                    "taxable_amount" => number_format($subtotal, 2, '.', ''),
                    "percent" => 19
                ];
            }

            if (!empty($item['ic'])) {
                $valorIc = $subtotal * 0.08;
                $tax_totals['ic']['taxable_amount'] += $subtotal;
                $tax_totals['ic']['tax_amount'] += $valorIc;

                $lineTaxes[] = [
                    "tax_id" => 2,
                    "tax_amount" => number_format($valorIc, 2, '.', ''),
                    "taxable_amount" => number_format($subtotal, 2, '.', ''),
                    "percent" => 8
                ];
            }

            if (!empty($item['inc'])) {
                $valorInc = $subtotal * 0.04;
                $tax_totals['inc']['taxable_amount'] += $subtotal;
                $tax_totals['inc']['tax_amount'] += $valorInc;

                $lineTaxes[] = [
                    "tax_id" => 4,
                    "tax_amount" => number_format($valorInc, 2, '.', ''),
                    "taxable_amount" => number_format($subtotal, 2, '.', ''),
                    "percent" => 4
                ];
            }

            $invoice_lines[] = [
                "unit_measure_id" => 70,
                "invoiced_quantity" => $cantidad,
                "line_extension_amount" => number_format($subtotal, 2, '.', ''),
                "free_of_charge_indicator" => false,
                "tax_totals" => $lineTaxes,
                "description" => $item['nombre'] ?? '',
                "code" => 'ITEM-' . ($index + 1),
                "type_item_identification_id" => 1,
                "price_amount" => number_format($precioUnitario, 2, '.', ''),
                "base_quantity" => $cantidad
            ];
        }

        // Filtrar impuestos en cero
        $tax_totals = array_filter($tax_totals, fn($tax) => $tax['tax_amount'] > 0);

        // Convertir a formato final
        $final_tax_totals = [];
        foreach ($tax_totals as $key => $tax) {
            $tax_id = match($key) {
                'iva' => 1,
                'ic' => 2,
                'inc' => 4,
            };

            $final_tax_totals[] = [
                "tax_id" => $tax_id,
                "tax_amount" => number_format($tax['tax_amount'], 2, '.', ''),
                "taxable_amount" => number_format($tax['taxable_amount'], 2, '.', ''),
                "percent" => $tax['percent']
            ];
        }

        return [
            'invoice_lines' => $invoice_lines,
            'tax_totals' => $final_tax_totals
        ];
    }  
    
}