<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class CheckApiKeyNit
{


    public function handle(Request $request, Closure $next)
    {
        $apiKey = $request->header('api-key');
        $nit = $request->header('nit');

  
    
        if (!$apiKey || !$nit) {
            return response()->json(['error' => 'Headers api_key y nit requeridos'], 400);
        }
        
        // Buscar usuario solo por nit
        $usuario = User::where('nit', $nit)->first();
        
    
        if (!$usuario || !$usuario->activo) {
            return response()->json(['error' => 'Usuario inactivo o no encontrado'], 401);
        }
    
        // Verificar api_key plano con el hash guardado
        // if (!password_verify($apiKey, $usuario->api_key)) {
        //     return response()->json(['error' => 'api_key inválido'], 401);
        // }

         if (hash('sha256', $apiKey) !== $usuario->api_key) {
            return response()->json(['error' => 'api_key inválido'], 401);
        }
    
        $request->attributes->set('usuario', $usuario);
    
        return $next($request);
    }
}
