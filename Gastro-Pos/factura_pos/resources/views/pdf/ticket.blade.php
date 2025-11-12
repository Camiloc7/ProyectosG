    <!DOCTYPE html>

    <html lang="es">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=72mm">
        <style>
        @page {
            size: 55mm auto;
            /* ancho de papel térmico, altura automática */
            margin: 1;
            /* elimina márgenes de impresión */
        }


        html,
        body {
            margin: 1mm;
            padding: 0;
            height: auto;
            /* ajusta la altura automáticamente */
        }


        .header {
            text-align: center;
            margin-bottom: 3mm;
            /* espacio con lo siguiente */
        }

        .header div {
            margin: 0 1mm;
            padding: 0;
            line-height: 1.1em;
            /* más apretado */
        }

        .bold {
            font-weight: bold;
            white-space: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }


        p {
            margin: 0;
            padding: 0;
            line-height: 1.2em;
            /* control exacto */
        }

        .ticket {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            width: 55mm;
            /* mismo que @page */
            margin: 0 auto;
            word-wrap: break-word;
        }

        .line {
            border-top: 1.5px dashed #000;
            margin: 8px 0;
        }

        .detalle {
            border-collapse: collapse;
            font-size: 10pt;
            table-layout: fixed;
            /* importante para alinear columnas */
        }

        .left {
            text-align: left;
        }

        .center {
            text-align: center;
        }

        .right {
            text-align: right;
        }



        .cufe-text {
            margin: 6px 0;
            /* margen arriba y abajo del texto CUFE */
        }
        </style>

    </head>

    <body>
        <div class="ticket">
            <div class="header">
                <div class="bold">{{$data['nombre_gastro']}}</div>
                <div class="bold">Resolucion: {{$data['resolution_number']}}</div>
                <div class="bold">Nit: {{$data['nitEmpresa']}}</div>
                <div class="bold">Responsabilidad: {{$data['responsabilidad']}}</div>
                <div class="bold">Obligacion: {{$data['obligacion']}}</div>
                <div class="bold">Tel: {{$data['telefonoEmpresa']}}</div>
                <div class="bold">Ubicacion: {{$data['direccionempresa']}}</div>
                <div class="bold">{{$data['municipio']}} - {{$data['departamento']}}</div>
                <div class="bold">GASTRO-POS</div>
                <div class="bold">Quality Soft Services</div>
                <div class="bold">+57 310 3188070</div>
            </div>
            <div class="line"></div>
            <div class="line"></div>
            <p><strong>Factura:</strong> {{ $data['prefix'] }}{{ $data['number'] }}</p>
            <p><strong>Fecha:</strong> {{ $data['date'] }} {{ $data['time'] }}</p>
            <div class="line"></div>
            <div class="line"></div>

            @if($data['identification_number'] != 111111111111)
            <p class="bold">Cliente</p>
            <p>{{ $data['customer_name'] }}</p>
            <p>Identificacion: {{ $data['identification_number'] }}-{{ $data['customer_dv'] }}</p>
            <p>Dir: {{ $data['customer_address'] }}</p>
            <p>Tel: {{ $data['customer_phone'] }}</p>
            <p>Email: {{ $data['customer_email'] ?? 'Sin especificar' }}</p>
            <p>Ubicacion: {{ $data['customer_address'] }} - {{ $data['departamento'] }}</p>

            <div class="line"></div>
            <div class="line"></div>
            @endif


            <p class="bold">Detalle</p>

            <table class="detalle" width="90%">
                <thead>
                    <tr>
                        <th class="left" style="width: 40%;">Item</th>
                        <th class="center" style="width: 20%;">Cant.</th>
                        <th class="right" style="width: 25%;">Precio</th>
                    </tr>
                </thead>
            </table>

            <table class="detalle" width="90%">
                <tbody>
                    @foreach ($data['items'] as $item)
                    <tr>
                        <td class="left" style="width: 40%;">{{ $item['nombre'] }}</td>
                        <td class="center" style="width: 5%;">{{ $item['cantidad'] }}</td>
                        <td class="right" style="width: 25%;">${{ number_format($item['precio'], 2, ',', '.') }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="line"></div>


            <div class="line"></div>



            <div class="center">
                @if($data['identification_number'] != 111111111111)
                <p><strong>Subtotal:</strong>
                    ${{ number_format($data['legal_monetary_totals']['tax_exclusive_amount'], 2) }}</p>
                @endif
                <p><strong>Total:</strong> ${{ number_format($data['total'], 2) }}</p>
            </div>
            <div class="line"></div>
            <!-- <div class="line"></div> -->
            <div style="text-align: center; margin-top: 10px;">
                <!-- @if(isset($data['qr_base64']))
                <img src="data:image/png;base64,{{ $data['qr_base64'] }}" width="100">
                @else
                <div style="height: 100px; border: 1px dashed #ccc;">
                    <p style="font-size: 12px; margin-top: 35px;">[ Aquí va el QR ]</p>
                </div>
                @endif

                <div class="line"></div> -->

                @if(isset($data['cufe']))
                <div class="line"></div>
                <p class="center">CUFE: {{ $data['cufe'] }} </p>
                @else
                <div class="line">
                    <p class="center">CUFE:
                        8123bc3ed37f20f8db0b8d5ec1f39632bc5c348eb025775122c9974948845d6f48df705befe670a977b8510d9f123689
                    </p>
                </div>
                @endif
            </div>

            <div class="line"></div>
            <div class="line"></div>
            <p class="center">¡Gracias por su compra!</p>
            <p class="center">Construya con liquidez. Facture con Quality</p>
            <p class="center">+57 310 3188070</p>
            <p class="center">www.qualitysoftservices.com</p>
        </div>
    </body>

    </html>