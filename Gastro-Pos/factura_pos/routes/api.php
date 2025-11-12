<?php

use App\Http\Controllers\ResolucionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RestauranteController;
use App\Http\Middleware\CheckApiKeyNit;
use App\Http\Middleware\superAdmin;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CorreoController;
use Illuminate\Support\Facades\Log;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test-password', function () {
    $original = 'clave-qualitysoft';

    $hash = password_hash($original, PASSWORD_ARGON2ID);
    $ok = password_verify($original, $hash);

    return [
        'hash' => $hash,
        'verificacion' => $ok ? 'VERIFICADO' : 'ERROR',
    ];
});

Route::post('/enviar-correo', [CorreoController::class, 'enviarCorreo']);

Route::get('/test-log', function() {
    Log::debug('Prueba de log');
    Log::emergency('Prueba de log');
    Log::alert('Prueba de log');
    Log::critical('Prueba de log');
    Log::error('Prueba de log');
    Log::warning('Prueba de log');
    Log::notice('Prueba de log');
    Log::info('Prueba de log');
    Log::debug('Prueba de log');
    return 'Log enviado';
});



//Route::post('/factura-pos', [RestauranteController::class, 'facturaPos'])->middleware(CheckApiKeyNit::class);


//RUTAS UTILIZADAS PARA EL RESTAURANTE desde el MS de camilo.
Route::middleware([CheckApiKeyNit::class])->group(function () {
    Route::post('/factura-pos', [RestauranteController::class, 'facturaPos']);
    //Route::post('/factura-pos/anulacion/{id}', [RestauranteController::class, 'facturaPos']); 

});

// Route::post('/crear-users', [UserController::class, 'store']);


//RUTAS UTILIZADAS PARA ADMINISTRADOR SUPER desde el facturador.    
Route::middleware([superAdmin::class])->group(function () {
    Route::post('/crear-users', [UserController::class, 'store']);
    Route::put('/update-users/{nit}', [UserController::class, 'update']);
    Route::patch('/update-users/{nit}/tokenApi', [UserController::class, 'updateTokenApi']);
    Route::post('/create-resolution', [ResolucionController::class, 'store']);
    Route::put('/update-resolution/{id}', [ResolucionController::class, 'update']);
});