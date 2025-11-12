'use client';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import InputField from '@/components/ui/InputField';
import PrivateRoute from '@/helpers/PrivateRoute';
import { Card } from '@mui/material';
import { Badge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, useRef } from 'react';
interface PieceInput {
    shape_coords: [number, number][];
    quantity: number;
}
interface CuttingRequest {
    lamina_coords: [number, number][];
    pieces_to_cut: PieceInput[];
    buffer_size: number;
    generations: number;
    population_size: number;
}
interface PlacedPiece {
    type: string;
    coords: [number, number][];
    template_id: string;
}
interface OptimizationResult {
    lamina: [number, number][];
    placed: PlacedPiece[];
    unplaced_count: number;
    runtime: number;
}
const API_URL = "http://localhost:8001/optimize_cut";
const EXAMPLE_PIECES: PieceInput[] = [
    {
        shape_coords: [[0, 0], [200, 0], [200, 250], [0, 250]],
        quantity: 2
    },
];
const coordsToSvgPoints = (coords: [number, number][]): string => {
    return coords.map(([x, y]) => `${x},${y}`).join(' ');
};
const generateColor = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 24) & 0xFF).toString(16).padStart(2, '0')}${(hash >> 16 & 0xFF).toString(16).padStart(2, '0')}${(hash >> 8 & 0xFF).toString(16).padStart(2, '0')}`;
    return color;
};
const PiecePreviewSVG = ({ coords, color, pieceId }: { coords: [number, number][], color: string, pieceId: string }) => {
    const allX = coords.map(c => c[0]);
    const allY = coords.map(c => c[1]);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    const width = maxX - minX;
    const height = maxY - minY;
    if (width === 0 || height === 0 || coords.length < 3) return <div className="text-xs text-red-500">Forma Inválida</div>;
    const SIZE = 60; 
    let scaleFactor = 1;
    const maxDim = Math.max(width, height);
    if (maxDim > 0) {
        scaleFactor = (SIZE - 10) / maxDim;
    }
    const scaledWidth = width * scaleFactor;
    const scaledHeight = height * scaleFactor;
    const padding = 5; 
    const mappedPoints = coords.map(([x, y]) => {
        const scaledX = (x - minX) * scaleFactor;
        const scaledY = (maxY - y) * scaleFactor;
        return [scaledX, scaledY];
    });
    const svgPoints = mappedPoints.map(([x, y]) => `${x + padding},${y + padding}`).join(' ');
    return (
        <div className="flex flex-col items-center">
            <Badge
                className="font-bold mb-1"
                style={{ backgroundColor: color }}
            >
                {pieceId}
            </Badge>
            <svg
                width={SIZE + padding * 2}
                height={SIZE + padding * 2}
                viewBox={`0 0 ${scaledWidth + padding * 2} ${scaledHeight + padding * 2}`}
                className="rounded-lg shadow-inner bg-gray-100 border border-gray-300"
            >
                <title>Previsualización de Pieza {pieceId}</title>
                <polygon
                    points={svgPoints}
                    fill={color}
                    fillOpacity="0.8"
                    stroke="#374151"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
};
const SVGVisualizer = ({ lamina, placed, unplaced_count, runtime }: OptimizationResult) => {
     if (lamina.length === 0) return <p>Defina las coordenadas de la lámina.</p>;
    const allX = lamina.map(c => c[0]);
     const allY = lamina.map(c => c[1]);
     const minX = Math.min(...allX);
     const minY = Math.min(...allY);
     const maxX = Math.max(...allX);
     const maxY = Math.max(...allY);    
     const width = maxX - minX;
     const height = maxY - minY;
     if (width === 0 || height === 0) return <p className="text-red-500">Error: El ancho o alto de la lámina es cero. Por favor, defina dimensiones válidas.</p>;
     const SVG_WIDTH = 800; 
     const scaleFactor = SVG_WIDTH / width;
     const SVG_HEIGHT = height * scaleFactor;
     const viewBox = `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`;
     const mapToSvgPoints = (coords: [number, number][]): string => {
         const scaledCoords = coords.map(([x, y]) => {
             const scaledX = (x - minX) * scaleFactor;
             const scaledY = SVG_HEIGHT - ((y - minY) * scaleFactor); 
             return [scaledX, scaledY];
         }) as [number, number][];
         
         return coordsToSvgPoints(scaledCoords);
     };
     const placedCounts = placed.reduce((acc, piece) => {
         acc[piece.template_id] = (acc[piece.template_id] || 0) + 1;
         return acc;
     }, {} as Record<string, number>);
     return (
         <div className="mt-4">
             <div className="flex flex-wrap gap-2 items-center mb-4">
                 <Badge className='bg-green-600'>Colocadas: {placed.length}</Badge>
                 <Badge className='bg-red-600'>No Colocadas: {unplaced_count}</Badge>
                 <Badge >Tiempo: {runtime.toFixed(2)}s</Badge>
             </div> 
             <div className="flex justify-center">
                 <svg 
                     viewBox={viewBox} 
                     width="100%" 
                     height={SVG_HEIGHT > 100 ? SVG_HEIGHT : 500} 
                     className="border border-gray-300 shadow-xl rounded-lg bg-gray-50 max-w-[800px]"
                 >
                     <polygon 
                         points={mapToSvgPoints(lamina)}
                         fill="#e0e0e0"
                         stroke="#333"
                         strokeWidth="2"
                     />
                      {placed.map((piece, index) => {
                         const color = generateColor(piece.template_id);
                         return (
                             <polygon
                                 key={index}
                                 points={mapToSvgPoints(piece.coords)}
                                 fill={color}
                                 fillOpacity="0.8"
                                 stroke="#1f2937" 
                                 strokeWidth="1"
                             >
                                 <title>{piece.template_id} (Pieza {index + 1})</title>
                             </polygon>
                         );
                     })}
                 </svg>
             </div>
                          <h3 className="text-md font-semibold mt-6 mb-2">Resumen de Colocación por Tipo:</h3>
             <div className="flex flex-wrap gap-3">
                 {Object.entries(placedCounts).map(([id, count]) => (
                     <Badge key={id} style={{ backgroundColor: generateColor(id), color: 'white' }}>
                         {id}: {count} unidades
                     </Badge>
                 ))}
             </div>
         </div>
     );
 };
export default function CuttingOptimizerPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<OptimizationResult | null>(null);
    const [laminaWidth, setLaminaWidth] = useState<number>(1000);
    const [laminaHeight, setLaminaHeight] = useState<number>(500);
    const [designMode, setDesignMode] = useState<'rectangle' | 'polygon'>('rectangle');
    const [rectWidth, setRectWidth] = useState<number>(100);
    const [rectHeight, setRectHeight] = useState<number>(100);
    const [newPieceQuantity, setNewPieceQuantity] = useState<number>(1);
    const [coordsInput, setCoordsInput] = useState<string>('[[0, 0], [100, 0], [100, 100], [0, 100]]'); 
    const [designError, setDesignError] = useState<string | null>(null);
    const laminaCoords: [number, number][] = [
        [0, 0],
        [laminaWidth, 0],
        [laminaWidth, laminaHeight],
        [0, laminaHeight]
    ];
    const [requestData, setRequestData] = useState<CuttingRequest>({
        lamina_coords: laminaCoords,
        pieces_to_cut: EXAMPLE_PIECES,
        buffer_size: 5,
        generations: 10,
        population_size: 40,
    });
    useEffect(() => {
        setRequestData(prev => ({
            ...prev,
            lamina_coords: laminaCoords
        }));
    }, [laminaWidth, laminaHeight]);
    const generateRectangleCoords = (w: number, h: number): [number, number][] => {
        return [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h]
        ];
    };
    const handleAddPiece = () => {
        setDesignError(null);
        let coords: [number, number][] | null = null;
        let pieceDescription = '';
        if (designMode === 'rectangle') {
            if (rectWidth <= 0 || rectHeight <= 0) {
                setDesignError("Ancho y alto deben ser mayores a 0.");
                return;
            }
            coords = generateRectangleCoords(rectWidth, rectHeight);
            pieceDescription = `Rectángulo ${rectWidth}x${rectHeight}`;
        } else if (designMode === 'polygon') {
            try {
                const parsedCoords: [number, number][] = JSON.parse(coordsInput);

                if (!Array.isArray(parsedCoords) || parsedCoords.length < 3 || !parsedCoords.every(c => Array.isArray(c) && c.length === 2 && c.every(n => typeof n === 'number' && isFinite(n)))) {
                    setDesignError('Formato de coordenadas inválido. Mínimo 3 pares [x, y].');
                    return;
                }
                coords = parsedCoords;
                pieceDescription = `Polígono de ${parsedCoords.length} vértices`;

            } catch (e) {
                setDesignError("Error al parsear las coordenadas JSON.");
                return;
            }
        }

        if (coords) {
            const newPiece: PieceInput = {
                shape_coords: coords,
                quantity: newPieceQuantity > 0 ? newPieceQuantity : 1,
            };

            setRequestData(prev => ({
                ...prev,
                pieces_to_cut: [...prev.pieces_to_cut, newPiece]
            }));

            setRectWidth(100);
            setRectHeight(100);
            setNewPieceQuantity(1);
            setCoordsInput('[[0, 0], [100, 0], [100, 100], [0, 100]]');
        }
    };
    const handleDeletePiece = (index: number) => {
        setRequestData(prev => ({
            ...prev,
            pieces_to_cut: prev.pieces_to_cut.filter((_, i) => i !== index)
        }));
    };
    const handleChangePieceQuantity = (index: number, newQuantity: number) => {
        if (newQuantity < 0) return;
        setRequestData(prev => ({
            ...prev,
            pieces_to_cut: prev.pieces_to_cut.map((p, i) => i === index ? { ...p, quantity: newQuantity } : p)
        }));
    };
    const handleOptimize = async () => {
        if (requestData.pieces_to_cut.length === 0) {
            console.error("Debe definir al menos una pieza para cortar.");
            return;
        }
        setLoading(true);
        setResults(null);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error en la API (${response.status}): ${errorText}`);
            }
            const data: OptimizationResult = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Error al optimizar el corte:", error);
        } finally {
            setLoading(false);
        }
    };
    const DESIGNER_SIZE = 250;
    const currentDesignCoords = designMode === 'rectangle' 
        ? generateRectangleCoords(rectWidth, rectHeight)
        : (function() {
            try {
                return JSON.parse(coordsInput);
            } catch {
                return [];
            }
        })();
    const currentAllX = currentDesignCoords.length > 0 ? currentDesignCoords.map((c: any[]) => c[0]) : [0, DESIGNER_SIZE];
    const currentAllY = currentDesignCoords.length > 0 ? currentDesignCoords.map((c: any[]) => c[1]) : [0, DESIGNER_SIZE];
    const currentMinX = Math.min(...currentAllX);
    const currentMinY = Math.min(...currentAllY);
    const currentMaxX = Math.max(...currentAllX);
    const currentMaxY = Math.max(...currentAllY);
    const currentWidth = currentMaxX - currentMinX;
    const currentHeight = currentMaxY - currentMinY;
    const maxDim = Math.max(currentWidth, currentHeight, 1);
    let designerScaleFactor = (DESIGNER_SIZE - 20) / maxDim; 
    if (designMode === 'rectangle' && (rectWidth === 0 || rectHeight === 0)) {
        designerScaleFactor = 1; 
    }
    const mapDesignToSvgPoints = (coords: [number, number][]): string => {
        const scaledCoords = coords.map(([x, y]) => {
            const scaledX = (x - currentMinX) * designerScaleFactor + 10;
            const scaledY = DESIGNER_SIZE - ((y - currentMinY) * designerScaleFactor + 10);
            return [scaledX, scaledY];
        }) as [number, number][];

        return coordsToSvgPoints(scaledCoords);
    };
    const designerViewBox = `0 0 ${DESIGNER_SIZE} ${DESIGNER_SIZE}`;
    return (
        <PrivateRoute>
            <LayoutAdmi>
                <div className="p-6 max-w-7xl mx-auto">
                    <h1 className="text-3xl font-extrabold mb-8 text-gray-800 border-b pb-2">Optimización de Corte (Nesting)</h1>
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <Card>
                                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-blue-700">1. Lámina y Parámetros</h2>
                                <div className="space-y-4 mb-6">
                                    <h3 className="text-lg font-semibold">Dimensiones de la Lámina (Unidades)</h3>
                                    <InputField
                                        label="Ancho de la Lámina (X)"
                                        type="number"
                                        value={laminaWidth}
                                        onChange={(e: any) => setLaminaWidth(parseFloat(e.target.value))}
                                    />
                                    <InputField
                                        label="Alto de la Lámina (Y)"
                                        type="number"
                                        value={laminaHeight}
                                        onChange={(e: any) => setLaminaHeight(parseFloat(e.target.value))}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold border-t pt-4">Parámetros del Algoritmo Genético</h3>
                                <div className="space-y-4 mt-2">
                                    <InputField
                                        label="Separación Mínima (Buffer Size)"
                                        type="number"
                                        value={requestData.buffer_size}
                                        onChange={(e: any) => setRequestData({ ...requestData, buffer_size: parseFloat(e.target.value) })}
                                    />
                                    <InputField
                                        label="Generaciones"
                                        type="number"
                                        value={requestData.generations}
                                        onChange={(e: any) => setRequestData({ ...requestData, generations: parseInt(e.target.value) })}
                                    />
                                    <InputField
                                        label="Tamaño de Población"
                                        type="number"
                                        value={requestData.population_size}
                                        onChange={(e: any) => setRequestData({ ...requestData, population_size: parseInt(e.target.value) })}
                                    />
                                </div>
                            </Card>
                            <Card>
                                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-green-700">2. Diseño y Gestión de Piezas ({requestData.pieces_to_cut.length} Tipos)</h2>
                                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                                    <h3 className="text-md font-semibold text-green-800">Añadir Nuevo Tipo de Pieza</h3>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant={designMode === 'rectangle' ? 'default' : 'outline'}
                                            onClick={() => setDesignMode('rectangle')}
                                            className={designMode === 'rectangle' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-green-600 border-green-600 hover:bg-green-100'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                                            Rectángulo (Simple)
                                        </Button>
                                        <Button
                                            variant={designMode === 'polygon' ? 'default' : 'outline'}
                                            onClick={() => setDesignMode('polygon')}
                                            className={designMode === 'polygon' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-green-600 border-green-600 hover:bg-green-100'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.39 6.84h7.61l-6.18 4.67l2.39 6.84l-6.18-4.67L5.8 20.35l2.39-6.84L2 8.84h7.61z" /></svg>
                                            Polígono (Coordenadas)
                                        </Button>
                                    </div>
                                    <hr className='my-3' />

                                    <div className='flex gap-4'>
                                        <div className='flex-1 space-y-3'>
                                            {designMode === 'rectangle' ? (
                                                <>
                                                    <InputField
                                                        label="Ancho (X en Unidades)"
                                                        type="number"
                                                        value={rectWidth}
                                                        onChange={(e: any) => setRectWidth(parseFloat(e.target.value) || 0)}
                                                    />
                                                    <InputField
                                                        label="Alto (Y en Unidades)"
                                                        type="number"
                                                        value={rectHeight}
                                                        onChange={(e: any) => setRectHeight(parseFloat(e.target.value) || 0)}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <label className="text-sm font-medium text-gray-700 block">
                                                        Coordenadas Poligonales (Ej: `[[x1, y1], ...]`)
                                                    </label>
                                                    <textarea
                                                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs h-24 resize-none"
                                                        placeholder="Ej: [[0, 0], [100, 0], [100, 150], [0, 100]]"
                                                        value={coordsInput}
                                                        onChange={(e) => setCoordsInput(e.target.value)}
                                                    ></textarea>
                                                </>
                                            )}

                                            <InputField
                                                label="Cantidad Requerida"
                                                type="number"
                                                value={newPieceQuantity}
                                                onChange={(e: any) => setNewPieceQuantity(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="w-[250px] flex-shrink-0 flex flex-col items-center justify-center">
                                            <h4 className='text-sm font-semibold mb-1'>Previsualización</h4>
                                            <svg
                                                width={DESIGNER_SIZE}
                                                height={DESIGNER_SIZE}
                                                viewBox={designerViewBox}
                                                className="border border-gray-400 shadow-md bg-white rounded-lg"
                                            >
                                                <title>Diseñador de Piezas</title>
                                                <rect 
                                                    x="0" 
                                                    y="0" 
                                                    width={DESIGNER_SIZE} 
                                                    height={DESIGNER_SIZE} 
                                                    fill="#f9fafb" 
                                                />
                                                {currentDesignCoords.length >= 3 && (
                                                    <polygon
                                                        points={mapDesignToSvgPoints(currentDesignCoords)}
                                                        fill="#34d399" 
                                                        fillOpacity="0.7"
                                                        stroke="#059669"
                                                        strokeWidth="2"
                                                        strokeLinejoin="round"
                                                    />
                                                )}
                                                {designMode === 'rectangle' && rectWidth > 0 && rectHeight > 0 && (
                                                     <>
                                                        <text x={DESIGNER_SIZE / 2} y={DESIGNER_SIZE - 5} 
                                                            fontSize="10" textAnchor="middle" fill="#1f2937" 
                                                            transform={`translate(0, 0)`}
                                                        >
                                                            {rectWidth}
                                                        </text>
                                                        <text x="5" y={DESIGNER_SIZE / 2} 
                                                            fontSize="10" textAnchor="start" fill="#1f2937" 
                                                            transform={`rotate(-90 ${5}, ${DESIGNER_SIZE/2})`}
                                                        >
                                                            {rectHeight}
                                                        </text>
                                                    </>
                                                )}
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {designError && <p className="text-red-500 text-sm">{designError}</p>}
                                    
                                    <Button
                                        onClick={handleAddPiece}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md"
                                    >
                                        Añadir Tipo de Pieza
                                    </Button>
                                </div>
                                <h3 className="text-md font-semibold mb-3 border-t pt-4">Piezas Definidas:</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {requestData.pieces_to_cut.map((p, index) => {
                                        const pieceId = String.fromCharCode(65 + index);
                                        const color = generateColor(`Piece-${index}`);

                                        return (
                                            <div key={index} className="flex items-center p-3 border rounded-lg shadow-sm bg-gray-50 transition hover:bg-gray-100">
                                                <div className="w-20 flex-shrink-0 mr-4">
                                                    <PiecePreviewSVG
                                                        coords={p.shape_coords}
                                                        color={color}
                                                        pieceId={pieceId}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-semibold text-gray-800">Pieza: {pieceId}</p>
                                                    <p className="text-xs text-gray-600 truncate">Vértices: {p.shape_coords.length}</p>
                                                </div>
                                                <div className="w-20 mx-4 flex-shrink-0">
                                                    <InputField
                                                        label="Cant."
                                                        type="number"
                                                        value={p.quantity}
                                                        onChange={(e: any) => handleChangePieceQuantity(index, parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDeletePiece(index)}
                                                    className='h-9 w-9 text-white ml-2 flex-shrink-0'
                                                    title={`Eliminar Pieza ${pieceId}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h-1M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-6 0h8V4H9z" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button
                                    onClick={handleOptimize}
                                    disabled={loading || requestData.pieces_to_cut.length === 0}
                                    className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 shadow-xl"
                                >
                                    {loading ? 'Calculando Mejor Nesting...' : 'Iniciar Optimización'}
                                </Button>

                                {loading && <p className="mt-2 text-center text-sm text-blue-500">El algoritmo está trabajando, por favor espera...</p>}
                            </Card>
                        </div>
                        <div className="xl:col-span-3">
                            <Card className="h-full">
                                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">3. Resultado del Plan de Corte</h2>

                                {results ? (
                                    <SVGVisualizer {...results} />
                                ) : (
                                    <div className="text-center p-10 text-gray-500 border border-dashed rounded-lg h-full min-h-[500px] flex items-center justify-center bg-gray-50">
                                        <p className='text-lg'>Define tus piezas e inicia la optimización para visualizar el plan de corte.</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </LayoutAdmi>
        </PrivateRoute>
    );
}