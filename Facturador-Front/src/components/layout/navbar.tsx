// 'use client';
import React, {
  startTransition,
  useEffect,
  useState,
  useTransition,
} from 'react';
import '@fontsource/montserrat/700.css';
import { useRouter } from 'next/navigation';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { useUserStore } from '@/store/useUser';
import Spinner from '../feedback/Spinner';

const NavBar = () => {
  const router = useRouter();
  const { traerInfoDeUsuarios, infoDelUsuario } = useUserStore();
  const [isPending, startTransition] = useTransition();
  const [haveToken, seTHaveToken] = useState(false);
  useEffect(() => {
    const token = getTokenFromCookies();
    if (token) {
      seTHaveToken(true);
      return;
    }
  }, []);

  return (
    <header className="flex justify-between items-center bg-white h-[80px] border-b-2 border-gray-100 px-[20px] md:px-[80px]">
      <img
        src="/logo_con_palito.jpeg"
        alt="Quality Logo"
        width="90"
        style={{ height: 'auto' }}
      />

      {haveToken ? (
        <button
          onClick={() => {
            startTransition(() => {
              router.push('/gestionDeFacturasElectronicas');
            });
          }}
          className="bg-[#00A7E1] text-white border-none rounded-[40px] py-[10px] px-[20px] md:px-[30px] text-sm md:text-[16px] font-[600] ml-[1vw] cursor-pointer"
        >
          Ingresar
        </button>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="bg-[#00A7E1] text-white border-none rounded-[40px] py-[10px] px-[20px] md:px-[30px] text-sm md:text-[16px] font-[600] ml-[1vw] cursor-pointer"
        >
          Iniciar sesión
        </button>
      )}
      {isPending ? (
        <Spinner /> // Mostrar el spinner mientras está cargando
      ) : (
        ''
      )}
    </header>
  );
};

export default NavBar;
