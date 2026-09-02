import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  RefreshCw, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Sparkles,
  Map,
  ArrowRight,
  Activity
} from 'lucide-react';
import { formatIndonesianDateFull } from '../utils/dateUtils';
import { getDailyTrafficReport } from '../utils/trafficUtils';

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  activeCount: number;
  waitingCount: number;
  completedCount: number;
  urgentH1Count: number;
  onSelectUrgent: () => void;
  onOpenMapTab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isLoading,
  onRefresh,
  onSearch,
  activeCount,
  waitingCount,
  completedCount,
  urgentH1Count,
  onSelectUrgent,
  onOpenMapTab
}) => {
  const [searchValue, setSearchValue] = useState('');
  const today = new Date();

  const trafficData = useMemo(() => {
    return getDailyTrafficReport(today);
  }, [today]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#003B73] text-white shadow-md">
      {/* Top Main Brand & Search Bar (GoPay Signature Informa Blue) */}
      <div className="bg-gradient-to-r from-[#002D5A] via-[#003B73] to-[#005691] border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Brand & Store Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0 group">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-sky-300 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white tracking-tight text-base sm:text-xl font-sans">
                    INFORMA
                  </span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Alam Sutera
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-sky-200/80 font-medium hidden sm:flex items-center gap-1.5 mt-0.5">
                  <span>Logistik & Database Pelanggan</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-sky-300"></span>
                  <span className="text-sky-100">Living World Hub</span>
                </p>
              </div>
            </div>

            {/* GoPay-Style Search Input (White Pill / Soft Glow) */}
            <div className="flex-1 max-w-md hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  id="header-receipt-search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Cari No. Receipt (2408...), nama, atau HP..."
                  className="w-full pl-10 pr-24 py-2.5 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-sky-400 outline-hidden transition-all"
                />
                <Search className="w-4 h-4 text-[#003B73] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="submit"
                  id="header-search-btn"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold bg-[#003B73] hover:bg-[#002D5A] text-white rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Cari</span>
                  <ArrowRight className="w-3 h-3 text-sky-300" />
                </button>
              </form>
            </div>

            {/* Right Controls: Sync & Date */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs text-sky-100 font-medium flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-300" /> {formatIndonesianDateFull(today)}
                </span>
                <span className="text-[11px] text-sky-200/70 font-mono">
                  {lastUpdated ? `Sync: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Sinkronisasi...'}
                </span>
              </div>

              {/* Refresh Button (GoPay-like pill) */}
              <button
                id="refresh-data-btn"
                onClick={onRefresh}
                disabled={isLoading}
                title="Perbarui Data Langsung dari Google Sheets"
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-2xl transition-all border border-white/20 backdrop-blur-md disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 text-sky-300 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isLoading ? 'Menyinkron...' : 'Sync Data'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* GoPay Quick Status & Action Pills Bar */}
      <div className="bg-[#002855]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 border-b border-white/10 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          
          {/* Quick Metrics (GoPay Wallet style) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Urgent H-1 Alert Button */}
            {urgentH1Count > 0 && (
              <button
                id="urgent-h1-counter-btn"
                onClick={onSelectUrgent}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/90 text-white font-bold border border-red-400 hover:bg-red-600 transition-all cursor-pointer shadow-xs animate-pulse-soft"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                <span>{urgentH1Count} Instalasi Besok (H-1)</span>
              </button>
            )}

            {/* Active Deliveries */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/20 text-sky-100 font-semibold border border-sky-400/30">
              <Clock className="w-3.5 h-3.5 text-sky-300" />
              <span>{activeCount} Dalam Pengiriman</span>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-100 font-semibold border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{completedCount} Selesai</span>
            </div>

            {/* Waiting */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 text-slate-300 font-medium border border-white/10">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>{waitingCount} Antrean</span>
            </div>

            {/* Traffic Light Status Pill */}
            <div 
              title={`Traffic Jabodetabek & Tangsel: ${trafficData.statusTitle}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold border transition-all ${
                trafficData.overallStatus === 'RED'
                  ? 'bg-red-500/30 text-red-200 border-red-400/50'
                  : trafficData.overallStatus === 'YELLOW'
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                  : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                trafficData.overallStatus === 'RED'
                  ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                  : trafficData.overallStatus === 'YELLOW'
                  ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              }`}></span>
              <span>
                Traffic: {trafficData.overallStatus === 'RED' ? 'Macet 🔴' : trafficData.overallStatus === 'YELLOW' ? 'Padat 🟡' : 'Lancar 🟢'}
              </span>
            </div>

          </div>

          <div className="text-[11px] text-sky-200/70 font-medium hidden md:flex items-center gap-1.5 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-sky-300" />
            <span>Store ALSUT #014</span>
          </div>

        </div>
      </div>
    </header>
  );
};

