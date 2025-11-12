'use client';

import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface TableData {
  prefijo: string;
  consecutivo: string;
  contrato: string;
  pagada: string;
  factura: string;
  estado: string;
  xml: string;
  enviar: string;
  opciones: string;
  dian: string;
}

const sampleData: TableData[] = [
  {
    prefijo: 'PRE',
    consecutivo: '001',
    contrato: 'CT-2024-001',
    pagada: 'Sí',
    factura: 'Factura',
    estado: 'Activo',
    xml: 'Ver',
    enviar: 'Enviar',
    opciones: '...',
    dian: 'Validado',
  },
  {
    prefijo: 'PRE',
    consecutivo: '002',
    contrato: 'CT-2024-002',
    pagada: 'No',
    factura: 'Factura',
    estado: 'Pendiente',
    xml: 'Ver',
    enviar: 'Enviar',
    opciones: '...',
    dian: 'Pendiente',
  },
  {
    prefijo: 'PRE',
    consecutivo: '003',
    contrato: 'CT-2024-003',
    pagada: 'Sí',
    factura: 'Factura',
    estado: 'Activo',
    xml: 'Ver',
    enviar: 'Enviar',
    opciones: '...',
    dian: 'Validado',
  },
];

export default function Component() {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TableData | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  const headers: { key: keyof TableData; label: string }[] = [
    { key: 'prefijo', label: 'Prefijo' },
    { key: 'consecutivo', label: 'Consecutivo' },
    { key: 'contrato', label: 'Contrato' },
    { key: 'pagada', label: 'Pagada' },
    { key: 'factura', label: 'Factura' },
    { key: 'estado', label: 'Estado' },
    { key: 'xml', label: 'XML' },
    { key: 'enviar', label: 'Enviar' },
    { key: 'opciones', label: 'Opciones' },
    { key: 'dian', label: 'DIAN' },
  ];

  const handleSort = (key: keyof TableData) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    });
  };

  const sortedData = [...sampleData].sort((a, b) => {
    if (sortConfig.key !== null) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  return (
    <div className="w-full overflow-auto px-[70px] mt-[25px]">
      <Table className="bg-white rounded-[8px]">
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead
                key={header.key}
                className="text-muted-foreground bg-[#FCFCFD]"
              >
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-[500] hover:bg-transparent"
                  onClick={() => handleSort(header.key)}
                >
                  {header.label}
                  <ChevronDown style={{ height: '1rem', width: '1rem' }} />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow key={index}>
              {headers.map((header) => (
                <TableCell key={header.key}>
                  {header.key === 'factura' ? (
                    <Badge
                      variant="secondary"
                      className="bg-[#E2F5FF] text-[#00A7E1] hover:bg-blue-100"
                    >
                      {row[header.key]}
                    </Badge>
                  ) : (
                    row[header.key]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
