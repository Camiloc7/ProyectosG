export const InputFieldDos = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  name,
}: {
  label?: string;
  type?: string;
  value: any;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  error?: boolean;
  placeholder?: string;
  name?: string;
}) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border rounded-lg px-3 py-2 text-sm ${
          error ? "border-red-500" : "border-gray-300"
        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
      >
        <option value="">Seleccionar tipo</option>
        <option value="COCINA">COCINA</option>
        <option value="BAR">BAR</option>
        <option value="CAJA">CAJA</option>
        <option value="TICKET">TICKET</option>
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm ${
          error ? "border-red-500" : "border-gray-300"
        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
      />
    )}
  </div>
);
