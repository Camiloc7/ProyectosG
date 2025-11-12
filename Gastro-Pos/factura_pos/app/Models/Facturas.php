<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Facturas extends Model
{
    protected $table = 'factura_pos';

    protected $fillable = [
        'numero_factura',
        'resolucion_id',
        'cufe',
        'fecha_factura',
        'hora_factura',
        'subtotal',
        'iva',
        'total',
        'customer_identification_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'metodo_pago_id',
        'forma_pago_id',
        'json_completo_factura',
        'estado',
        'in',
        'inc',
        'plate_number',
        'location',
        'cashier',
        'cash_type',
        'sales_code',
        'customer_municipality_id',
        'customer_type_organization_id',
        'customer_type_regime_id',
        'customer_merchant_registration',
        'postal_zone_code',
        'payment_due_date',
    ];

    /**
     * Insertar una nueva factura.
     */
    public static function insertarFactura(array $datosFactura)
    {
        return self::create($datosFactura);
    }

    /**
     * Obtener todas las facturas.
     */
    public static function getFacturas()
    {
        return self::orderBy('created_at', 'desc')->get();
    }

    /**
     * Obtener una factura por su número.
     */
    public static function getFactura($numeroFactura)
    {
        return self::where('numero_factura', $numeroFactura)->first();
    }
}