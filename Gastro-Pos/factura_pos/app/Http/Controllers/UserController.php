<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Http\JsonResponse;



class UserController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'nit' => 'required|string',
            'password' => 'nullable|string|min:6',
            'tokenApi'  => 'nullable|string',
            'api_key' => 'required|string',
        ]);



        // Buscar usuario por nit
        $user = User::where('nit', $request->nit)->first();

        // Hashear api_key con Argon2id
       // $hashedApiKey = password_hash($request->api_key, PASSWORD_ARGON2ID);
        $hashedApiKey = hash('sha256', $request->api_key);
        //

        if ($user) {
            // Actualizar usuario existente
            $user->update([
                'name' => $request->name,   
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : $user->password,
                'api_key' => $hashedApiKey,
                'tokenApi' => $request->tokenApi ?? $user->tokenApi,
                'activo' => true,
                'responsabilidad_fiscal' => $request->responsabilidad_fiscal ?? "No responsable",
                'obligacion' => $request->obligacion ?? "No responsable",
                'direccion' => $request->direccion ?? "Sin especificar.",
                'telefono' => $request->telefono ?? "31511111",
                'departamento' => $request->departamento ?? "Sin especificar.",
                'municipality_id' => $request->municipality_id ?? 1495

            ]);

            $message = 'Usuario actualizado con éxito.';
        } else {
            // Crear nuevo usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : null,
                'nit' => $request->nit,
                'api_key' => $hashedApiKey,
                'tokenApi' => $request->tokenApi ?? null,
                'activo' => true,
                'responsabilidad_fiscal' => $request->responsabilidad_fiscal ?? "No responsable",
                'obligacion' => $request->obligacion ?? "No responsable",
                'direccion' => $request->direccion ?? "Sin especificar.",
                'telefono' => $request->telefono ?? "31511111",
                'municipio' => $request->municipio ?? "Bogotá",
                'departamento' => $request->departamento ?? "Sin especificar.",
                'municipality_id' => $request->municipality_id ?? 5

            ]);

            $message = 'Usuario creado con éxito.';
        }

        return response()->json([
            'message' => $message,
            'api_key' => $request->api_key, // siempre devolver api_key plano
        ], 200);
    }


    public function update(Request $request, $nit)
    {
        $user = User::where('nit', $nit)->first();

        $request->validate([
            'name' => 'sometimes|required|string',
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => 'nullable|string|min:6',
            'tokenApi' => 'nullable|string',
            'activo' => 'sometimes|boolean',
            'regenerate_api_key' => 'nullable|boolean',
            'api_key' => 'sometimes|required|string',
        ]);

        if ($user) {
            // Actualizar usuario existente
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : $user->password,
                'api_key' => $request->api_key,
                'tokenApi' => $request->tokenApi ?? $user->tokenApi,
                'activo' => true,
                'responsabilidad_fiscal' => $request->responsabilidad_fiscal ?? "No responsable",
                'obligacion' => $request->obligacion ?? "No responsable",
                'direccion' => $request->direccion ?? "Sin especificar.",
                'telefono' => $request->telefono ?? "31511111",
                'departamento' => $request->departamento ?? "Sin especificar.",
                'municipality_id' => $request->municipality_id ?? 1495

            ]);

            $message = 'Usuario actualizado con éxito.';
        } else {
            // Crear nuevo usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : null,
                'nit' => $request->nit,
                'api_key' => $request->api_key,
                'tokenApi' => $request->tokenApi ?? null,
                'activo' => true,
                'responsabilidad_fiscal' => $request->responsabilidad_fiscal ?? "No responsable",
                'obligacion' => $request->obligacion ?? "No responsable",
                'direccion' => $request->direccion ?? "Sin especificar.",
                'telefono' => $request->telefono ?? "31511111",
                'departamento' => $request->departamento ?? "Sin especificar.",
                'municipality_id' => $request->municipality_id ?? 1495

            ]);

            $message = 'Usuario creado con éxito.';
        }


        return response()->json([
            'success' => true,
            'message' => $message,
            'api_key' => $request->api_key, // siempre devolver api_key plano
        ], 200);
    }



    public function updateTokenApi(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $request->validate([
            'tokenApi' => 'required|string',
        ]);

        $user->tokenApi = $request->tokenApi;
        $user->save();

        return response()->json(['message' => 'tokenApi actualizado con éxito']);
    }
}