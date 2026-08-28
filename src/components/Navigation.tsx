import React from 'react';
import { Truck, Map, Search, PackageCheck, AlertTriangle, Layers, Building2, ChevronRight, Compass } from 'lucide-react';

export type ActiveTab = 'TRACKING' | 'DATABASE' | 'SEARCH';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeCount: number;
  completedCount: number;
  urgentH1Count: number;
}

export const Sidebar: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  completedCount,
  urgentH1Count,
}) => {
  const navItems = [
    {
      id: 'TRACKING' as ActiveTab,
      label: 'Live Tracking',
      subtitle: 'Pengiriman & Instalasi',
      icon: Truck,
      badge: activeCount,
      badgeColor: 'bg-sky-50 text-[#003B73] border-sky-200',
      urgentBadge: urgentH1Count > 0 ? `${urgentH1Count} H-1` : null,
    },
    {
      id: 'DATABASE' as ActiveTab,
      label: 'Database Customer',
      subtitle: 'Peta & Histori Selesai',
      icon: Map,
      badge: completedCount,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      urgentBadge: null,
    },
    {
      id: 'SEARCH' as ActiveTab,
      label: 'Cari No. Receipt',
      subtitle: 'Pencarian Instan Resi',
      icon: Search,
      badge: null,
      badgeColor: '',
      urgentBadge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-5rem)] p-3">
      
      {/* GoPay Style Hub Info Card */}
      <div className="mb-4">
        <div className="bg-gradient-to-br from-[#003B73] to-[#005691] rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-200 font-bold text-[11px] uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Pusat Logistik</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h4 className="font-extrabold text-sm text-white mt-1.5">
            Informa Living World
          </h4>
          <p className="text-[11px] text-sky-100/80 mt-0.5">
            Alam Sutera, Tangerang Selatan
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          Menu Navigasi
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id.toLowerCase()}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                isActive
                  ? 'bg-[#003B73] text-white shadow-md shadow-[#003B73]/20 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#003B73]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 group-hover:bg-sky-50 text-[#003B73]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.label}
                  </span>
                  <span className={`block text-[10px] ${isActive ? 'text-sky-200' : 'text-slate-400'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {item.urgentBadge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-red-500 text-white rounded-full shadow-xs animate-bounce">
                    {item.urgentBadge}
                  </span>
                )}
                {item.badge !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    isActive ? 'bg-white/20 text-sky-100 border-white/20' : `${item.badgeColor}`
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mt-auto">
        <span className="text-[10px] text-slate-500 block font-bold">
          Sistem Pengiriman Informa
        </span>
        <span className="text-[10px] text-[#003B73] font-mono font-medium block">
          Living World Hub v2.4
        </span>
        <div className="mt-2 pt-2 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-600">
            Dibuat oleh Anak Buah AM Fatah
          </span>
        </div>
      </div>

    </aside>
  );
};

export const BottomNav: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  completedCount,
  urgentH1Count,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 shadow-2xl">
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        
        {/* Tracking Tab */}
        <button
          id="mobile-nav-tracking"
          onClick={() => onTabChange('TRACKING')}
          className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all relative ${
            activeTab === 'TRACKING' 
              ? 'bg-sky-50 text-[#003B73] font-extrabold shadow-xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {urgentH1Count > 0 && (
            <span className="absolute top-1 right-3 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
          )}
          <Truck className={`w-5 h-5 mb-0.5 ${activeTab === 'TRACKING' ? 'text-[#003B73]' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">Tracking ({activeCount})</span>
        </button>

        {/* Database Tab */}
        <button
          id="mobile-nav-database"
          onClick={() => onTabChange('DATABASE')}
          className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all ${
            activeTab === 'DATABASE' 
              ? 'bg-sky-50 text-[#003B73] font-extrabold shadow-xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Map className={`w-5 h-5 mb-0.5 ${activeTab === 'DATABASE' ? 'text-[#003B73]' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">Database ({completedCount})</span>
        </button>

        {/* Search Tab */}
        <button
          id="mobile-nav-search"
          onClick={() => onTabChange('SEARCH')}
          className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all ${
            activeTab === 'SEARCH' 
              ? 'bg-sky-50 text-[#003B73] font-extrabold shadow-xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className={`w-5 h-5 mb-0.5 ${activeTab === 'SEARCH' ? 'text-[#003B73]' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">Cari Receipt</span>
        </button>

      </div>
    </nav>
  );
};

