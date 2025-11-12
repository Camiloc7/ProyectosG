<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('factura_pos', function (Blueprint $table) {
            $table->id(); // ID autoincremental de la factura

            // --- Datos principales de la factura ---
            $table->string('numero_factura')->unique(); // "number"
            $table->foreignId('resolucion_id') // Referencia a la resolución
                  ->constrained('resoluciones')
                  ->onDelete('restrict');
            $table->string('codigo_dian', 50)->nullable(); // Código de la DIAN (ej. CUFE/UUID) - Campo "technical_key" de resolución o generado.

            // --- Fechas y Tiempos ---
            $table->date('fecha_factura'); // "date"
            $table->time('hora_factura'); // "time"

            // --- Totales Financieros ---
            $table->decimal('subtotal', 12, 2); // "cash_information.subtotal" o "legal_monetary_totals.tax_exclusive_amount"
            $table->decimal('iva', 10, 2); // "tax_totals[0].tax_amount" (siempre y cuando solo haya un IVA)
            $table->decimal('total', 12, 2); // "legal_monetary_totals.payable_amount"

            // --- Datos del Cliente ---
            $table->string('customer_identification_number', 50); // "customer.identification_number"
            $table->string('customer_name'); // "customer.name"
            $table->string('customer_email')->nullable(); // "customer.email"
            $table->string('customer_phone', 20)->nullable(); // "customer.phone"

            // --- Forma de Pago ---
            $table->string('metodo_pago_id', 50); // "payment_form.payment_method_id" (ej: '10' para efectivo)
            $table->string('forma_pago_id', 50); // "payment_form.payment_form_id" (ej: '1' para contado)


            // --- Campo JSON para el resto de los detalles ---
            // Aquí se guarda toda la estructura JSON detallada de tu función json($array)
            $table->json('json_completo_factura');

            $table->string('estado', 50)->default('generada'); // Estado de la factura
            $table->timestamps(); // created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factura_pos');
    }
};
