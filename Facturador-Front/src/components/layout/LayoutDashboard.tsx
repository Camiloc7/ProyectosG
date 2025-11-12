import React, { ReactNode } from 'react';
import NavBarAdmi from './navBarAdmi';
import SideBar from './sidebar';
import SidebarDashboard from './sidebarDashboard';

const LayoutDashboard = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <main className="relative">
        <NavBarAdmi />
        <SidebarDashboard />
        <div className=" ml-0 mt-20 md:ml-16">{children}</div>
      </main>
    </div>
  );
};

export default LayoutDashboard;
