<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;


class EmailServices extends Mailable
{
    use Queueable, SerializesModels;

    public $datos;
    protected $ticketPDF;
    protected $xmlString64;

    public function __construct($datos, $ticketPDF, $xmlString64)
    {
        $this->datos = $datos;
        $this->ticketPDF = $ticketPDF;
        $this->xmlString64 = $xmlString64;
    }

    public function envelope(): Envelope
    {
        $nit = $this->datos['nit'];
        $nombreEstablecimiento = $this->datos['name'];
        $consecutivo = $this->datos['consecutivo'];
        $nombreCliente = $this->datos['nombreCliente'];


        $subject = $nit . ";" . $nombreEstablecimiento . ";" . $consecutivo . ";01;" . $nombreEstablecimiento . ";" . $nombreCliente;

        return new Envelope(
            subject: $subject
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.email_services',
            with: [
                'datos' => $this->datos
            ]
        );
    }

    public function attachments(): array
    {
        $attachments = [];

       // Decodificar PDF si viene como base64
        $ticketPDFContent = is_string($this->ticketPDF) 
            ? base64_decode($this->ticketPDF) 
            : $this->ticketPDF->output(); // si es un objeto PDF tipo Dompdf

        // Adjuntar PDF
        $attachments[] = Attachment::fromData(fn () => $ticketPDFContent, 'factura-pos.pdf')
            ->withMime('application/pdf');


        // Adjuntar XML desde base64
         if (!empty($this->xmlString64)) {
                $xmlDecoded = base64_decode($this->xmlString64);
                if ($xmlDecoded !== false && !empty($xmlDecoded)) {
                    $attachments[] = Attachment::fromData(fn () => $xmlDecoded, 'factura-pos.xml')
                        ->withMime('application/xml');
                }
            }

        return $attachments;
    }
}