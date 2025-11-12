<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Mail\EmailServices;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;


class CorreoController extends Controller
{
  public function enviarCorreo(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'titulo' => 'required|string',
                'mensaje' => 'required|string'
            ]);

            $datos = [
                'titulo' => $request->titulo,
                'mensaje' => $request->mensaje
            ];

            Mail::to($request->email)->send(new EmailPruebas($datos));

            Log::info('Correo enviado a: '.$request->email);

            return response()->json(['status' => true, 'message' => 'Correo enviado']);
        } catch (\Exception $e) {
            Log::error('Error enviando correo: '.$e->getMessage());
            return response()->json(['status' => false, 'error' => $e->getMessage()]);
        }
    }

   
}
