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
        Schema::create('resoluciones', function (Blueprint $table) {
            $table->id(); // id (bigint(20) UNSIGNED, PK, AUTO_INCREMENT)

            // Asumiendo que 'usuario_id' es una FK a tu tabla 'users'
            $table->foreignId('usuario_id') // bigint(20) UNSIGNED
                  ->constrained('users') // La tabla a la que hace referencia
                  ->onDelete('restrict'); // O 'cascade', dependiendo de tu lógica

            $table->tinyInteger('type_document_id')->unsigned(); // tinyint(3) UNSIGNED
            $table->string('prefix', 10); // varchar(10)
            $table->string('resolution'); // varchar(255)
            $table->date('resolution_date'); // date
            $table->string('technical_key'); // varchar(255)
            $table->bigInteger('from')->unsigned(); // bigint(20) UNSIGNED
            $table->bigInteger('to')->unsigned(); // bigint(20) UNSIGNED

            // generated_to_date
            $table->timestamp('generated_to_date')->default(DB::raw('CURRENT_TIMESTAMP'));

            $table->date('date_from'); // date (tu 'date_from' que yo llamé 'fecha_inicio_vigencia')
            $table->date('date_to'); // date (tu 'date_to' que yo llamé 'fecha_fin_vigencia')

            $table->timestamps(); // created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resoluciones');
    }
};
