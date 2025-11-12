import React from 'react';

interface ButtonProps {
  title: string;
  bg: string;
  onClick?: () => void; // Agrega esta propiedad para manejar clics
}

const Button: React.FC<ButtonProps> = ({ title, bg, onClick }) => {
  return (
    <button
      onClick={onClick} // Asegúrate de pasar la función aquí
      className={`${bg === '#FFFFFF' ? 'bg-[#FFFFFF]' : 'bg-[#00A7E1]'} ${
        bg === '#FFFFFF' ? 'text-[#00A7E1]' : 'text-[#FFFFFF]'
      } border-none rounded-[40px] py-[10px] px-[30px] text-[16px] font-[700] ml-[1vw] cursor-pointer`}
    >
      {title}
    </button>
  );
};

export default Button;
