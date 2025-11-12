'use client';

interface CallToActionProps {
  scrollToForm: () => void; // 🔹 Especificamos el tipo correctamente
}

export default function CallToAction({ scrollToForm }: CallToActionProps) {
  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={scrollToForm}
        className="bg-[#00A7E1] mt-6 text-white border-none rounded-[40px] py-[10px] px-[30px] text-[16px] font-[600] ml-[1vw] cursor-pointer"
      >
        Saber más
      </button>
      <img
        src="/comenza_aqui.png"
        alt="Comenza_aqui"
        className="h-[70px] absolute right-[-1vw] md:right-[37vw] 2xl:right-[38vw] top-0"
      />
    </div>
  );
}
