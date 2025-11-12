import React, { useState, useEffect, useRef } from 'react';

interface Administrador {
  id: string;
  nombre: string;
}

interface AdminSelectorProps {
  administradores: Administrador[];
  administradoresAsignados: string[];
  onChange: (selectedIds: string[]) => void;
}

const AdminSelector: React.FC<AdminSelectorProps> = ({
  administradores,
  administradoresAsignados,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>(
    administradoresAsignados
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedAdmins(administradoresAsignados);
  }, [administradoresAsignados]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };
  const handleCheckboxChange = (id: string) => {
    let updatedSelected: string[];
    if (selectedAdmins.includes(id)) {
      updatedSelected = selectedAdmins.filter((adminId) => adminId !== id);
    } else {
      updatedSelected = [...selectedAdmins, id];
    }
    setSelectedAdmins(updatedSelected);
    onChange(updatedSelected);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 cursor-pointer text-[#00A7E1]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={toggleDropdown}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {isOpen && (
        <div className="absolute mt-2 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          <ul className="max-h-60 overflow-auto py-2">
            {administradores.map((admin) => (
              <li key={admin.id} className="px-4 py-2 hover:bg-blue-100">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAdmins.includes(admin.id)}
                    onChange={() => handleCheckboxChange(admin.id)}
                    className="mr-2"
                  />
                  {admin.nombre}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminSelector;
