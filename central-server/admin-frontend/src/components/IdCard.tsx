import { 
  User as UserIcon,
  Globe,
} from 'lucide-react';

import { CardUser } from '@/types';
import Barcode from 'react-barcode';

const IDCard = ({ user, isBatch = false }: { user: CardUser; isBatch?: boolean }) => {
  const isManagement = user?.role?.toLowerCase().includes('staff') || user?.role?.toLowerCase().includes('admin');

  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 3);

  const formattedExpiry = expirationDate.toISOString().split("T")[0];
  
  return (
    <div 
      className={`
        relative bg-white overflow-hidden select-none print:shadow-none
        ${!isBatch ? 'shadow-2xl rounded-[14px] border border-slate-200' : 'border border-slate-300 rounded-[14px]'}
      `}
      style={{
        width: '85.6mm',
        height: '53.98mm',
        minWidth: '85.6mm',
        minHeight: '53.98mm',
      }}
    >
      {/* Glossy Gradient Background */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isManagement 
          ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700' 
          : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400'
      }`}>
        <svg className="absolute bottom-0 left-0 w-full opacity-40" viewBox="0 0 500 200" preserveAspectRatio="none">
          <path d="M0,150 C150,200 350,100 500,150 L500,200 L0,200 Z" fill="white" fillOpacity="0.2" />
          <path d="M0,120 C100,180 300,80 500,130 L500,200 L0,200 Z" fill="white" fillOpacity="0.1" />
        </svg>
        
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
      </div>

      {/* Card Slot Punch Visual */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-white/20 rounded-full border border-black/5 shadow-inner flex items-center justify-center">
        <div className="w-10 h-2 bg-black/10 rounded-full" />
      </div>

      {/* Top Header: Logo and School Name */}
      <div className="relative z-10 pt-1 px-5 flex items-center justify-between mb-1">
        {/* Logo */}
        <div className="w-8 h-8 bg-white/90 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
          <img src="/logo.jpg" className="w-full h-full object-cover" alt="School Logo" />
        </div>

        {/* School Name */}
        <div className="text-right">
          <p className={`text-[9px] font-black tracking-tight leading-none ${isManagement ? 'text-gray-700' : 'text-gray-700'}`}>
        SSEC
          </p>
          <p className={`text-[5px] font-bold ${isManagement ? 'text-gray-700/80' : 'text-gray-700/80'}`}>
        BAMENDA
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 px-5 pb-5 flex gap-5">
        
        {/* Photo Section */}
        <div className="w-[35%] aspect-4/5 bg-white rounded-sm border-[3px] border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
          {user.photo ? (
            <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <UserIcon className="text-slate-300" size={40} />
            </div>
          )}
        </div>

        {/* Text Details Section */}
        <div className="flex flex-col flex-1 text-slate-900">
          <h1 className={`text-[12px] font-black tracking-tight mb-1 ${isManagement ? 'text-white' : 'text-slate-800'}`}>
            ID CARD
          </h1>
          <p className={`text-[7px] font-bold opacity-80 mb-2 ${isManagement ? 'text-blue-100' : 'text-slate-600'}`}>
            {user.regno || '0000000000000000000'}
          </p>

          <div className="space-y-1.5">
            <div>
              <p className={`text-[6px] font-bold uppercase ${isManagement ? 'text-blue-200' : 'text-slate-500'}`}>Name</p>
              <p className={`text-[9px] font-black uppercase leading-none ${isManagement ? 'text-white' : 'text-slate-900'}`}>
                {user.firstName || 'NAME'} {user.lastName || 'SURNAME'}
              </p>
            </div>

            <div>
              <p className={`text-[6px] font-bold uppercase ${isManagement ? 'text-blue-200' : 'text-slate-500'}`}>Role</p>
              <p className={`text-[8px] font-bold uppercase leading-none ${isManagement ? 'text-white' : 'text-slate-800'}`}>
                {user.role || 'ROLE'}
              </p>
            </div>

            <div>
              {
                isManagement ? (
                  <>
                  </>
                ): (
                  <>
                    <p className={`text-[6px] font-bold uppercase ${isManagement ? 'text-blue-200' : 'text-slate-500'}`}>Class</p>
                    <p className={`text-[8px] font-bold uppercase leading-none ${isManagement ? 'text-white' : 'text-slate-800'}`}>
                      {user?.className || 'DESIGNATION'}
                    </p>
                  </>
                )
              }
            </div>

            <div>
              <p className={`text-[6px] font-bold uppercase ${isManagement ? 'text-blue-200' : 'text-slate-500'}`}>Gender</p>
              <p className={`text-[8px] font-bold uppercase leading-none ${isManagement ? 'text-white' : 'text-slate-800'}`}>
                {user.gender || 'GENDER'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Barcode and URL */}
      <div className="absolute bottom-1 left-5 right-5 flex items-end justify-between z-20">
        <div className="bg-white/90 px-1.5 py-1 rounded shadow-sm overflow-hidden">
          <Barcode
            value={user.cardUid || "000000000"}
            format="CODE128"
            width={0.9}
            height={14}
            margin={0}
            displayValue={false}
            fontSize={7}
            lineColor="#0f172a"
            background="transparent"
          />
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 mb-0.5">
            <Globe size={6} className={isManagement ? 'text-blue-200' : 'text-slate-500'} />
            <span className={`text-[7px] font-bold ${isManagement ? 'text-blue-100' : 'text-slate-600'}`}>www.fastwebcm.org</span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className={`text-[5px] font-bold uppercase ${isManagement ? 'text-blue-300' : 'text-slate-600'}`}>Expiration Date</span>
            <span className={`text-[7px] font-black ${isManagement ? 'text-white' : 'text-slate-800'}`}>{formattedExpiry}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDCard;
