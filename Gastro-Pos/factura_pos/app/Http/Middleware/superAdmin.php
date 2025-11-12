<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;


class superAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $nitSuperAdmin = env('NIT_SUPER_ADMIN');
        $apiKeyEntrante = $request->header('api-key');
        $nitRequest = $request->header('nit');
    

        // Validar que venga el NIT correcto
        if (!$nitRequest || $nitRequest !== $nitSuperAdmin) {
            return response()->json(['error' => 'Acceso denegado (NIT inválido)'], 403);
        }

        // Buscar usuario por NIT
        $usuario = User::where('nit', $nitRequest)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }


        // Verificar api_key (plano) contra el hash guardado
        // if (!$apiKeyEntrante || !password_verify($apiKeyEntrante, $usuario->api_key)) {
        //     return response()->json(['error' => 'api_key inválido'], 401);
        // }

        // echo "ApiKey entrante: ".$apiKeyEntrante."\n";
        
        // echo "ApiKey hasheada: ".hash('sha256', $apiKeyEntrante)."\n";

        // echo "ApiKey usuario: ".$usuario->api_key."\n";

        // exit;



        if (hash('sha256', $apiKeyEntrante) !== $usuario->api_key) {
            return response()->json(['error' => 'api_key inválido'], 401);
        }


        // Si querés pasar el usuario al controlador:
        $request->attributes->set('usuario', $usuario);

        return $next($request);
    }
}
