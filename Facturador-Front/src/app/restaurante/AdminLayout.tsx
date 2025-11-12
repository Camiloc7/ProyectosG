'use client';

import SidebarRestaurante from './sideBarRestaurante/page';

export default function AdminLayoutRestaurante({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SidebarRestaurante />
      <main className="flex-1 bg-white min-h-screen">{children}</main>
    </div>
  );
}
