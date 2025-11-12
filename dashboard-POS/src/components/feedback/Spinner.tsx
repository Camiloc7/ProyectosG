import { ORANGE } from "@/styles/colors";

const Spinner = () => (
  <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all">
    <div
      className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
      style={{ borderTopColor: ORANGE }}
    />
  </div>
);

export default Spinner;
