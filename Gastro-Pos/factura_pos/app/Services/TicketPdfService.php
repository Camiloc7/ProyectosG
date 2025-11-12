<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Dompdf\Dompdf;
use Dompdf\Options;

class TicketPdfService
{
    /*public function generar(array $data): \Symfony\Component\HttpFoundation\Response
    {
        // 1. Renderizar la vista como HTML
        $html = View::make('pdf.ticket', ['data' => $data])->render();

        // 2. Calcular la altura en milímetros usando DomPDF
        $heightMm = $this->calcularAlturaHtml($html);

        // 3. Usar Snappy para generar el PDF con esa altura
        $pdf = SnappyPdf::loadHTML($html)
            ->setOption('page-width', '72mm')
            ->setOption('page-height', "{$heightMm}mm")
            ->setOption('margin-top', '3mm')
            ->setOption('margin-bottom', '3mm')
            ->setOption('margin-left', '3mm')
            ->setOption('margin-right', '3mm')
            ->setOption('disable-smart-shrinking', true)
            ->setOption('print-media-type', true)
            ->setOption('no-pdf-compression', true);

        return $pdf->inline('ticket.pdf');
    }*/

   public function generar1(array $data): string
    {
        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $dompdf = new Dompdf($options);
        
        $html = View::make('pdf.ticket', ['data' => $data])->render();
        $dompdf->loadHtml($html, 'UTF-8');
        
        // Papel temporal muy alto
        $ticketWidth = 72 * 2.83465; // mm a puntos
        $tempHeight  = 50; // puntos, altura extra grande para medir
        $dompdf->setPaper([0, 0, $ticketWidth, $tempHeight]);
        
        $dompdf->render();
        
        // Medir altura real en puntos
        $heightPt = $dompdf->getCanvas()->get_height();

        // Generar nuevamente con altura exacta
        $dompdf->setPaper([0, 0, $ticketWidth, $heightPt]);
        $dompdf->render();

        // Devuelve contenido binario, no Response
        return $dompdf->output();
    }

    public function generar(array $data): \Symfony\Component\HttpFoundation\Response
        {
            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $dompdf = new Dompdf($options);

            $html = View::make('pdf.ticket', ['data' => $data])->render();
            $dompdf->loadHtml($html, 'UTF-8');

            // Convertir mm a puntos
            $ticketWidth = 54 * 2.83465; // ancho en puntos (54 mm)
            $tempHeight  = 500; // altura provisional grande para medir

            
            // Primer render con altura grande
            $dompdf->setPaper([0, 0, $ticketWidth, $tempHeight], 'portrait');
            $dompdf->render();

            // Medir altura real en puntos
            $heightPt = $dompdf->getCanvas()->get_height();

            // Render final con altura exacta
            $dompdf->setPaper([0, 0, $ticketWidth, $heightPt], 'portrait');
            $dompdf->render();

            return response($dompdf->output(), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="ticket.pdf"');
        }



    // public function generar(array $data): \Symfony\Component\HttpFoundation\Response
    // {
    //     $options = new Options();
    //     $options->set('isRemoteEnabled', true);
    //     $dompdf = new Dompdf($options);
        
    //     $html = View::make('pdf.ticket', ['data' => $data])->render();
    //     $dompdf->loadHtml($html, 'UTF-8');
        
    //     // Papel temporal muy alto
    //     $ticketWidth = 56; // mm a puntos ancho
    //     $tempHeight  = 100; // puntos, altura extra grande para medir
    //     $dompdf->setPaper([0, 0, $ticketWidth, $tempHeight], 'portrait');

        
    //     $dompdf->render();
        
    //     // Medir altura real en puntos
    //     $heightPt = $dompdf->getCanvas()->get_height();
        
    //     // Generar nuevamente con altura exacta
    //     $dompdf->setPaper([0, 0, $ticketWidth, $heightPt], 'portrait');
    //     $dompdf->render();

    //     // 6. Respuesta inline
      
    //     return response($dompdf->output(), 200)
    //         ->header('Content-Type', 'application/pdf')
    //         ->header('Content-Disposition', 'inline; filename="ticket.pdf"');
    // }

    // private function calcularAlturaHtml($html): float
    // {
    //     $dompdf = new Dompdf();
    //     $dompdf->loadHtml($html);
        
    //     $dompdf->setPaper([0, 0, 226.77, 100]); // 80mm ancho x altura arbitraria
    //     $dompdf->render();

    //     $canvas = $dompdf->getCanvas();
    //     $heightPt = $canvas->get_height(); // Altura en puntos (pt)

    //     // Convertir puntos a milímetros (1 pt = 0.3528 mm)
    //     return round($heightPt * 0.3528, 2);
   // }
}