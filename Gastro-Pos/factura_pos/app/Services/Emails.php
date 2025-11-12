<?php

namespace App\Services;

use App\Mail\EmailServices;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class Emails
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

      public function enviarFactura($email, $data, $ticketPDF, $xmlString64)
    {
        try {

        
            Mail::to($email)->send(new EmailServices($data, $ticketPDF, $xmlString64));
           

            return ['status' => true, 'message' => 'Correo enviado'];
        } catch (\Exception $e) {
            echo "Error enviando correo: " . $e->getMessage();
            Log::error('Error enviando correo: ' . $e->getMessage());
            return ['status' => false, 'error' => $e->getMessage()];
        }
    }
}