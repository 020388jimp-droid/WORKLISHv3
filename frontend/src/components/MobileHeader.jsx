import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MobileHeader = ({ onOpen }) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0b14] border-b border-[#1f1f2a] flex items-center justify-between px-4 z-40">
      <Link to="/dashboard" className="flex items-center gap-2">
        <span className="text-xl font-bold font-['Outfit'] text-white">
          Work<span className="text-[#7c3aed]">lish</span>
        </span>
      </Link>
      
      <button 
        onClick={onOpen}
        className="p-2 text-slate-400 hover:text-white"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;
