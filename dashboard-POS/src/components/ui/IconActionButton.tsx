import React, { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';

interface IconActionButtonProps {
  icon: ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

const IconActionButton: React.FC<IconActionButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  tooltip,
  className = ''
}) => {
  const buttonContent = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg 
        hover:bg-gray-200 
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
    >
      {icon}
    </button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

export default IconActionButton;

