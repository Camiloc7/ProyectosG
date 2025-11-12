// src/components/ui/IconActionButton.tsx
import React, { ReactNode } from 'react';
import BotonRestaurante from './Boton';
interface IconActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}
const IconActionButton: React.FC<IconActionButtonProps> = ({ label, icon, onClick, disabled = false }) => {
  return (
    <BotonRestaurante
      label={label}
      onClick={onClick}
      disabled={disabled}
      className="!p-2 !rounded-lg" 
    >
      {icon}
    </BotonRestaurante>
  );
};
export default IconActionButton;