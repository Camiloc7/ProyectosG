<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\Json_pos;
use App\Services\Json_factura_electronica;
use App\Services\Emails;
use App\Services\TicketPdfService;
use App\Models\Resolucion;
use App\Models\Facturas;


use SimpleSoftwareIO\QrCode\Facades\QrCode;




class RestauranteController extends Controller
{
    // POST /api/factura-pos

    public function facturaPos(Request $request)
    {

        $usuario = $request->attributes->get('usuario'); // del middleware
        $nit = $usuario->nit;
        $tokenApi = $usuario->tokenApi;
        $emailUser = $usuario->email;

        $request->validate([
            'plate_number' => 'required|string',
            'location' => 'required|string|min:6',
            'cashier' => 'required|string|min:6',
            'cash_type' => 'required|string',
            'sales_code' => 'required|integer',
            'subtotal' => 'required|numeric',
            'identification_number' => 'required|integer',
            'customer_name' => ' sometimes|required|string|min:6',
            'customer_dv' => 'sometimes|integer',
            'customer_email' => 'sometimes|email',
            'customer_phone' => 'sometimes|integer|min:6',
            'customer_address' => 'sometimes|string|min:6',
            'customer_type_document_identification_id' => 'required|integer',
            'customer_type_organization_id' => 'required|integer',
            'customer_municipality_id' => 'required|integer',
            // 'iva' => 'required|boolean',
            // 'ic' => 'required|boolean',
            // 'inc' => 'required|boolean',
            'number' => 'required|integer',
            'postal_zone_code' => 'required|string',
            'payment_form_id' => 'required|integer',
            'payment_method_id' => 'required|integer',
            'payment_due_date' => 'required|date',
            'duration_measure' => 'required|integer',
        ]);

      
        // $resolucion = Resolucion::where('nit', $nit)
        //     ->where('type_document_id', 15) // 15 es el tipo de documento para factura POS
        //     ->first();
        if($request->subtotal > 248995){
            $resolucion = Resolucion::where('nit', $nit)
            ->where('type_document_id', 1) // 1 es el tipo de documento para factura electronica
            ->first();
        }
        else{
            $resolucion = Resolucion::where('nit', $nit)
            ->where('type_document_id', 15) // 15 es el tipo de documento para factura POS
            ->first();
        }

        if($request->identification_number=="111111111111"){
            
            $resolucion = Resolucion::where('nit', $nit)
            ->where('type_document_id', 30) // 30 es el tipo de documento para factura interna
            ->first();
        }

        

        if (!$resolucion) {
            return response()->json(['error' => 'Resolución no encontrada para el NIT proporcionado'], 201);
        }

        $type_regime_id = $request->tipe_document_identification_id == 6 ? 1 : 2;

        if($request->identification_number=="222222222222"){
            $dv_cliente = 7;
        }
        else{
             $dv_cliente = $request->customer_dv ?? 0;
        }
        
        $email_cliente = $request->customer_email ?? "correogeneral@gmail.com";
        $phone_cliente = $request->customer_phone ?? 35011111;
        $address_cliente = $request->customer_address ?? " KR 3A 123.";
         
    
        $datosEntrada = [
            'numero_factura'=>$resolucion->consecutivo,
            'resolucion_id'=>$resolucion->id,
            'fecha_factura'=>date('Y-m-d'),
            'hora_factura'=>date('H:i:s'),
            'plate_number' => $request->plate_number,
            'location' => $request->location,
            'cashier' => $request->cashier,
            'cash_type' => $request->cash_type,
            'sales_code' => $request->sales_code,
            'subtotal' => $request->subtotal,
            'identification_number' => $request->identification_number,
            'customer_name' => $request->customer_name ?? 'Cliente Final',
            'customer_dv' => $dv_cliente,
            'customer_email' => $email_cliente,
            'customer_phone' => $phone_cliente,
            'customer_address' => $address_cliente,
            'customer_type_document_identification_id' => $request->customer_type_document_identification_id,
            'customer_identification_number'=> $request->identification_number,
            'customer_municipality_id' => $usuario->municipality_id,
            'customer_type_organization_id' => $request->customer_type_organization_id,
            'customer_type_regime_id' => $type_regime_id,
            'customer_merchant_registration' => 0,
            'postal_zone_code' => $request->postal_zone_code,
            'payment_form_id' => $request->payment_form_id,
            'forma_pago_id' => $request->payment_form_id,
            'payment_method_id' => $request->payment_method_id,
            'metodo_pago_id' => $request->payment_method_id,
            'payment_due_date' => date('Y-m-d'),
            'duration_measure' => $request->duration_measure,
            'number' => $resolucion->consecutivo,
            'resolution_number' => $resolucion->resolution,
            'nombre_gastro' =>$usuario->name,
            'prefix' => $resolucion->prefix,
            'benefits_code' => '0',
            'benefits_name' => 'Sin beneficio',
            'benefits_points' => 0,
            'items' => $request->items
        ];     

       
        if (empty($datosEntrada)) {
            return response()->json(['error' => 'Datos inválidos o vacíos'], 400);
        }

        $servicio = new Json_pos();
        $servicioEmail = new Emails();
        // Construir JSON a enviar a la DIAN o proveedor
        if($datosEntrada['subtotal'] > 248995){
            $servicio = new Json_factura_electronica();
            $jsonParaEnviar = $servicio->build($datosEntrada);   
        }
        else{
            $jsonParaEnviar = $servicio->build($datosEntrada);   
        }          

       
        $datosArray = json_decode($jsonParaEnviar, true); // true para que sea array       

        $datosEntrada['nitEmpresa'] = $nit;
        $datosEntrada['telefonoEmpresa'] = $usuario->telefono;
        $datosEntrada['direccionempresa'] = $usuario->direccion;
        $datosEntrada['municipio'] = $usuario->municipio;
        $datosEntrada['departamento'] = $usuario->departamento;
        $datosEntrada['responsabilidad'] = $usuario->responsabilidad;
        $datosEntrada['obligacion'] = $usuario->obligacion;
        $datosEntrada['date'] = date('Y-m-d');
        $datosEntrada['time'] = date('H:i:s');
        $datosEntrada['json_completo_factura'] =$jsonParaEnviar;
        $datosEntrada['legal_monetary_totals'] =  $datosArray['legal_monetary_totals'];
        $taxTotals = $datosArray['tax_totals'];
        $taxAmount = $taxTotals[0]['tax_amount']; // 👈 acceso correcto

        $datosEntrada['iva'] = 0.00;
        $datosEntrada['ic'] = $taxAmount;
        $datosEntrada['inc'] = 0.00;
        $datosEntrada['total'] = $datosEntrada['subtotal'] + $taxAmount;

        
        // Generar base64
        // Contenido del QR (podés poner un link, CUFE, etc.)
        $contenidoQR = 'https://play.google.com/store/apps/details?id=com.qualitycolombia.quality2&pcampaignid=web_share';
       
        // $qrBase64 = base64_encode(
        //     QrCode::format('png')->size(200)->generate($contenidoQR)
        //     );

        $qrBase64 = "base64_encode(
            QrCode::format('png')->size(200)->generate($contenidoQR)
        )";

        $datosEntrada['qr_base64'] = $qrBase64;

        if (!$jsonParaEnviar) {
            return response()->json(['status' => false,'message' => 'Error al construir JSON POS'], 500);
        }              
        
       
         if($request->identification_number!=111111111111)
            {  
                       

                $respuesta = $this->enviarFacturaPos($request->subtotal,$datosArray, $tokenApi);  

            
                if (!$respuesta) {
                    return response()->json(['status' => false,'message' => 'Error en respuesta de servicio externo'], 502);
                }

                $cufeDian = $respuesta['cufe'] ?? 'nulo';
                $qrString = $respuesta['QRStr'] ?? 'nulo';                             

                $isValid = data_get(
                    $respuesta,
                    'ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.IsValid'
                );
            
                $max_intento = 10;
                $intento = 1;
                $dv_cliente=1;

                $success = data_get($respuesta, 'success', null);

                if (!is_null($success) && $success === false) {
                    return $respuesta;
                }

                // Buscar DV real.
                while($intento < 10 && !$success && !$isValid){
                    $datosArray['customer']['dv'] =   $dv_cliente;
                    // exit;

                    $respuesta = $this->enviarFacturaPos($request->subtotal, $datosArray, $tokenApi);

                    // validar que IsValid exista
                        $isValid = data_get(
                            $respuesta,
                            'ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.IsValid',
                            false // valor por defecto si no existe
                        );
                        $success = data_get(
                            $respuesta,
                            'success'                
                        );      
                            
                    
                    $dv_cliente++;
                    $intento++;
                }
            
            

            

                if (!is_null($isValid) && $isValid==true) {
                    $incremento = $resolucion->incrementarConsecutivo();
                    $xmlString64 = data_get(
                        $respuesta,
                        'ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.XmlBase64Bytes'
                        );
                        
                    $rutaXml = $this->guardarXml($xmlString64,$usuario->nit);  
                    $datosEntrada['rutaXml'] = $rutaXml;
                    $cufeDian = $respuesta['cufe'] ?? 'nulo';
                    $qrString = $respuesta['QRStr'] ?? 'nulo';

                    $datosEntrada['cufe'] = $cufeDian;
                    $datosEntrada['qr_base64'] = $qrString;
                    //AGREGAR CUFE A FACTURA Y TICKET

                
                    Facturas::insertarFactura($datosEntrada);
                
                    //-----------------------------------------------------------------------------------------------

                
                    $servicesTicket = new TicketPdfService();
                    $ticket = $servicesTicket->generar($datosEntrada);

                    //enviar correo con pdf y xml.
                    $datos = [
                        'nit' => $usuario->nit,
                        'name' => $usuario->name,
                        'consecutivo' => $resolucion->prefijo."".$resolucion->consecutivo,
                        'nombreCliente' => $datosEntrada['customer_name'],
                    ];

                    $ticketBase64 = base64_encode($ticket);
                    
                    // --------OBTENER NOMBRE PDF PARA ENVIARLO EN CASO DE QUE LA FACTURA SUPERE $248.995------------
                    
                    if($datosEntrada['subtotal'] > 248995) {
                        $pdfUrl = data_get($respuesta, 'urlinvoicepdf', null);
                        $pdfEncode = $this->recuperarPDF($nit,$pdfUrl,$tokenApi);
                        $ticketBase64 = base64_encode($pdfEncode);
                    }

                    

                    $emailPrueba = "gajardo2292@gmail.com";
                    $respuesta = $servicioEmail->enviarFactura($email_cliente, $datos, $ticketBase64, $xmlString64);

                    //Enviar respaldo a establecimiento
                    $servicioEmail->enviarFactura($emailUser, $datos, $ticketBase64, $xmlString64);

                    return response()->json([
                        'status' => true,
                        'pdf_base64' => base64_encode($ticket),
                    ], 200);

                }
                
                // Decodificar la respuesta
                    // Asegurarse de que siempre trabajamos con array
                    if (is_string($respuesta)) {
                        $respuestaArray = json_decode($respuesta, true);
                    } elseif (is_array($respuesta)) {
                        $respuestaArray = $respuesta;
                    } else {
                        $respuestaArray = [];
                    }

                    $errores = [];

                    // Caso 1: viene en formato con "errors"
                    if (isset($respuestaArray['errors'])) {
                        foreach ($respuestaArray['errors'] as $campo => $mensajes) {
                            foreach ($mensajes as $msg) {
                                $errores[] = $msg;
                            }
                        }
                    }

                    // Caso 2: viene en formato con "message"
                    if (isset($respuestaArray['message']) && empty($errores)) {
                        $errores[] = $respuestaArray['message'];
                    }

                    // Mensaje final
                    $mensajeFinal = !empty($errores) 
                        ? implode(" | ", $errores) 
                        : "Error en la Dian.";

                    // Respuesta limpia
                    return response()->json([
                        'status' => false,
                        'message' => $mensajeFinal
                    ], 200);

                    
            }
        //-----------------  FACTURA INTERNA   ------------------------------------------------
        
        // OBTENER RESOLUCION INTERNA
            

        $resolucion = Resolucion::where('nit', $nit)
            ->where('type_document_id', 30) // 30 es el tipo de documento para factura interna
            ->first();

        $datosEntrada['numero_factura'] = $resolucion->consecutivo;
        $datosEntrada['resolucion_id'] = $resolucion->id;
        $datosEntrada['number'] = $resolucion->consecutivo;
        $datosEntrada['resolution_number'] = $resolucion->resolution;
        $datosEntrada['prefix'] = $resolucion->prefix;

        // echo json_encode($datosEntrada);
        // exit;

        Facturas::insertarFactura($datosEntrada);
        
        $incremento = $resolucion->incrementarConsecutivo();
        $servicesTicket = new TicketPdfService();
        $ticket = $servicesTicket->generar($datosEntrada); // array asociativo

      
        $xmlString64 = NULL;
        $datos = [
                    'nit' => $usuario->nit,
                    'name' => $usuario->name,
                    'consecutivo' => $resolucion->prefix."".$resolucion->consecutivo,
                    'nombreCliente' => $datosEntrada['customer_name'],
                ];
        //$ticketPDF = $ticket->getContent();
        $ticketBase64 = base64_encode($ticket);
        
        //Enviar respaldo a establecimiento
        $emailPrueba = "gajardo2292@gmail.com";
        $servicioEmail->enviarFactura($emailUser, $datos, $ticketBase64, $xmlString64);


        // return $ticket;
        return response()->json([
            'status' => true,
            'pdf_base64' => base64_encode($ticket),
        ], 200);


    }

    public function pedidoPos(Request $request){
         $request->validate([
            'plate_number' => 'required|string',
            'location' => 'required|string|min:6',
            'cashier' => 'required|string|min:6',
            'cash_type' => 'required|string',
            'sales_code' => 'required|integer',
            'subtotal' => 'required|numeric',
            'identification_number' => 'required|integer',
            'customer_name' => ' sometimes|required|string|min:6',
            'customer_dv' => 'sometimes|integer',
            'customer_email' => 'sometimes|email',
            'customer_phone' => 'sometimes|integer|min:6',
            'customer_address' => 'sometimes|string|min:6',
            'customer_type_document_identification_id' => 'required|integer',
            'customer_type_organization_id' => 'required|integer',
            'customer_municipality_id' => 'required|integer',
            // 'iva' => 'required|boolean',
            // 'ic' => 'required|boolean',
            // 'inc' => 'required|boolean',
            'number' => 'required|integer',
            'postal_zone_code' => 'required|string',
            'payment_form_id' => 'required|integer',
            'payment_method_id' => 'required|integer',
            'payment_due_date' => 'required|date',
            'duration_measure' => 'required|integer',
        ]);

      

        $x   = [
            'numero_factura'=>$resolucion->consecutivo,
            'resolucion_id'=>$resolucion->id,
            'fecha_factura'=>date('Y-m-d'),
            'hora_factura'=>date('H:i:s'),
            'plate_number' => $request->plate_number,
            'location' => $request->location,
            'cashier' => $request->cashier,
            'cash_type' => $request->cash_type,
            'sales_code' => $request->sales_code,
            'subtotal' => $request->subtotal,
            'identification_number' => $request->identification_number,
            'customer_name' => $request->customer_name ?? 'Cliente Final',
            'customer_dv' => $dv_cliente,
            'customer_email' => $email_cliente,
            'customer_phone' => $phone_cliente,
            'customer_address' => $address_cliente,
            'customer_type_document_identification_id' => $request->customer_type_document_identification_id,
            'customer_identification_number'=> $request->identification_number,
            'customer_municipality_id' => $usuario->municipality_id,
            'customer_type_organization_id' => $request->customer_type_organization_id,
            'customer_type_regime_id' => $type_regime_id,
            'customer_merchant_registration' => 0,
            'postal_zone_code' => $request->postal_zone_code,
            'payment_form_id' => $request->payment_form_id,
            'forma_pago_id' => $request->payment_form_id,
            'payment_method_id' => $request->payment_method_id,
            'metodo_pago_id' => $request->payment_method_id,
            'payment_due_date' => date('Y-m-d'),
            'duration_measure' => $request->duration_measure,
            'number' => $resolucion->consecutivo,
            'resolution_number' => $resolucion->resolution,
            'nombre_gastro' =>$usuario->name,
            'prefix' => $resolucion->prefix,
            'benefits_code' => '0',
            'benefits_name' => 'Sin beneficio',
            'benefits_points' => 0,
            'items' => $request->items
        ];     

    }

  private function guardarXml($xmlString64, $nitUsuario)
    {
        try {
            // 1. Decodificar el contenido Base64
            $contenidoXml = base64_decode($xmlString64);

            if ($contenidoXml === false) {
                throw new \Exception("Error al decodificar el XML en base64.");
            }

            // 2. Generar nombre único
            $nombreArchivo = 'factura_' . time() . '_' . uniqid() . '.xml';

            // 3. Definir ruta con el NIT
            $rutaRelativa = $nitUsuario . '/' . $nombreArchivo;
            $rutaCompleta = storage_path('app/' . $rutaRelativa);

            // 4. Crear el directorio si no existe
            if (!file_exists(dirname($rutaCompleta))) {
                mkdir(dirname($rutaCompleta), 0775, true);
            }

            // 5. Guardar el archivo
            file_put_contents($rutaCompleta, $contenidoXml);

            // 6. Devolver ruta relativa para guardar en la base de datos
            return $rutaRelativa;

        } catch (\Exception $e) {
            \Log::error("Error al guardar XML: " . $e->getMessage());
            return null;
        }
    }


    public function anularFacturaPos(Request $request, $idFacturaPos)
    {
        // Implementar lógica para anular factura POS
        // Esto podría implicar llamar a un endpoint externo o realizar una acción en la base de datos
        return response()->json(['message' => 'Factura anulada correctamente'], 200);
    }

    // Armado del JSON a enviar (puede estar en un servicio si preferís)
    private function armarJsonPos($nit, array $datos): array
    {
        return [
            'emisor_nit' => $nit,
            'cliente' => $datos['cliente'] ?? [],
            'items' => $datos['items'] ?? [],
            'totales' => $datos['totales'] ?? [],
            'fecha' => now()->toDateTimeString(),
        ];
    }

    // Enviar el JSON al endpoint externo (puede ser DIAN u otro proveedor)
    private function enviarFacturaPos($subtotal, array $json, $tokenApi)
    {
       $url = config('app.factura_pos_url');
       $url_factura_electronica = config('app.factura_electronica_url');

      

        try {

            if($subtotal<248995){
               
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $tokenApi,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post($url, $json);
            }else{
               
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $tokenApi,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post($url_factura_electronica, $json);
          }


            if ($response->successful()) {
                return $response->json();
            }

           

           // Log::error('Error al enviar factura POS: ' . $response->body());
            return $response->body();
        } catch (\Throwable $e) {
            echo "Excepción al enviar factura POS: " . $e->getMessage();
            Log::error('Excepción al enviar factura POS: ' . $e->getMessage());
            return null;
        }
    }

    private function recuperarPDF($nit, $nombreArchivo, $token)
    {
        $url = "https://apidian.appministrativos.com/api/invoice/{$nit}/{$nombreArchivo}";

            $response = Http::withToken($token)->get($url);

            if ($response->successful()) {
                $contenidoPdf = $response->body();

                //OPCIONAL: Guardar el archivo en storage/app/uploads/nominas/
                    // $path = "uploads/nominas/{$nombreArchivo}";
                    // Storage::disk('local')->put($path, $contenidoPdf);

                return $contenidoPdf; // retornamos el contenido binario del PDF
            }

            // Si hubo error en la petición
            return false;
       
    }

    public function obtenerToda(){

    }
}