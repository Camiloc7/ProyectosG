<?php


namespace App\Http\Controllers;

use App\Models\Resolucion;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ResolucionController extends Controller
{
    // Crear nueva resolución
    public function store(Request $request)
    {
        // Validar primero para tener los datos limpios

        $data = $request->validate([
            'usuario_id' => 'required|integer',
            'type_document_id' => 'required|integer',
            'nit' => 'required|max:20',
            'prefix' => 'required|string|max:10',
            'resolution' => 'required|string',
            'resolution_date' => 'required|date',
            'technical_key' => 'required|string|max:255',
            'from' => 'required|integer',
            'to' => 'required|integer',
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        // Verificar si ya existe una resolución con misma combinación
        $existingResolution = Resolucion::where('usuario_id', $data['usuario_id'])
            ->where('resolution', $data['resolution'])
            ->where('type_document_id', $data['type_document_id'])
            ->first();

        if ($existingResolution) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Ya existe una resolución con este número y tipo de documento para este usuario.'
            ], 409);
        }

        // Crear resolución
        $resolucion = Resolucion::create($data);

        return response()->json([
            'numeroresolucion' => $resolucion->resolution,
            'mensaje' => 'Resolución creada correctamente.'
        ], 201);
    }

    // Obtener resolución por id
    public function show($id)
    {
        $resolucion = Resolucion::findOrFail($id);
        return response()->json($resolucion);
    }

    public function getResolucionPorNitTipo($nit, $tipo)
    {
        $resolucion = Resolucion::where('nit', $nit)
            ->where('type_document_id', $tipo)
            ->first();

        if (!$resolucion) {
            return response()->json(['error' => 'Resolución no encontrada'], 404);
        }

        return response()->json($resolucion);
    }

    // Actualizar resolución
    public function update(Request $request, $id)
    {
        $resolucion = Resolucion::findOrFail($id);

        $data = $request->validate([
            'usuario_id' => 'sometimes|exists:users,id',
            'nit' => 'sometimes|max:20',
            'type_document_id' => 'sometimes|integer',
            'prefix' => 'sometimes|string|max:10',
            'resolution' => 'sometimes|string',
            'resolution_date' => 'sometimes|date',
            'technical_key' => 'sometimes|string',
            'from' => 'sometimes|integer',
            'to' => 'sometimes|integer',
            'generated_to_date' => 'nullable|date',
            'date_from' => 'sometimes|date',
            'date_to' => 'sometimes|date',
        ]);

        if ($resolucion) {
            $resolucion->update($data);
            $message = 'Resolución actualizada con éxito.';
        } else {
            $resolucion = Resolucion::create($data);
            $message = 'Resolución creada con éxito.';
        }

        return response()->json([
            'status' => true,
            'message' => $message,
        ]);
    }

    // Eliminar resolución
    public function destroy($id)
    {
        $resolucion = Resolucion::findOrFail($id);
        $resolucion->delete();

        return response()->json(['message' => 'Resolución eliminada'], 200);
    }

  

}
