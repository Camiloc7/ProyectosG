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
        Schema::create('facturas_anuladas', function (Blueprint $table) {
            $table->id(); // ID autoincremental de la anulación

            // Referencia a la factura POS original que fue anulada
            $table->foreignId('factura_pos_id')
                  ->constrained('factura_pos') // Referencia a la tabla factura_pos
                  ->onDelete('cascade'); // Si la factura POS original se elimina, se elimina el registro de anulación

            // Quién anuló la factura (ej: un usuario administrador)
            $table->foreignId('anulado_por_user_id')
                  ->nullable() // Podría ser nulo si es un proceso automático
                  ->constrained('users') // Asume tu tabla de usuarios se llama 'users'
                  ->onDelete('set null'); // Si el usuario que anuló se elimina, la referencia se pone en nulo

            $table->string('motivo_anulacion', 255); // Razón por la que se anuló la factura
            $table->text('notas_adicionales')->nullable(); // Detalles adicionales de la anulación
            $table->timestamp('fecha_anulacion')->useCurrent(); // Fecha y hora de la anulación
            $table->string('estado_anulacion', 50)->default('anulada'); // 'anulada', 'procesando_dian', etc.

            $table->timestamps(); // created_at y updated_at (podrían ser redundantes con fecha_anulacion, pero útiles)

            // Asegurar que una factura POS solo pueda ser anulada una vez
            $table->unique('factura_pos_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturas_anuladas');
    }
};
