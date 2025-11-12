import React, { ReactNode } from 'react';
import SideBar from './sidebar';
import NavBarAdmi from './navBarAdmi';

function LayoutAdmi({ children }: { children: ReactNode }) {
  return (
    <main className=" bg-[#F7F7F7] min-h-[92vh]">
      <NavBarAdmi />
      <SideBar />

      <div className=" ml-0 mt-20 md:ml-16">{children}</div>
    </main>
  );
}

export default LayoutAdmi;
