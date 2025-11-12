// src/components/StatusBadge.tsx
import { CheckIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { CheckCircle } from 'lucide-react';
import { FaCircleXmark } from 'react-icons/fa6';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let icon;
  let text;

  switch (status) {
    case '1':
      icon = <CheckCircle className="h-4 w-4 text-green-500" />;
      text = 'Aceptada por la DIAN';
      break;
    case '2':
      // mini spinner amarillo
      icon = (
        <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      );
      text = 'Pendiente';
      break;
    case '0':
    default:
      icon = <FaCircleXmark className="h-4 w-4 text-red-500" />;
      text = 'Rechazada por la DIAN';
  }

  return (
    <div className="relative flex items-center justify-center space-x-1 group">
      {icon}
      {/* <span className="text-sm font-medium cursor-help">{text}</span> */}

      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
        {text}
      </div>
    </div>
  );
}
