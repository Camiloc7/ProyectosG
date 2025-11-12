<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resolucion extends Model
{
    protected $table = 'resoluciones'; // opcional si el nombre coincide
    protected $fillable = [
        'usuario_id',
        'type_document_id',
        'nit',
        'prefix',
        'resolution',
        'resolution_date',
        'technical_key',
        'from',
        'to',
        'generated_to_date',
        'date_from',
        'date_to',
    ];

    // En Resolucion.php
    public function incrementarConsecutivo()
    {
        if ($this->consecutivo >= $this->to) {
            return response()->json(['error' => 'Se alcanzó el límite máximo de la resolución.'], 400);
        }

        $this->consecutivo += 1;
        $this->save();

        return true;
    }

}