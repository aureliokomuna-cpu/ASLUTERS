import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  MapPin, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Navigation,
  Compass,
  Zap,
  Info,
  Car
} from 'lucide-react';
import { CorridorTrafficInfo, JabodetabekTrafficSummary, TrafficStatusLevel } from '../types/traffic';
import { getDailyTrafficReport } from '../utils/trafficUtils';

interface TrafficReportWidgetProps {
  defaultExpanded?: boolean;
}

export const TrafficReportWidget: React.FC<TrafficReportWidgetProps> = ({
  defaultExpanded = true,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Auto-refresh timer every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const trafficData: JabodetabekTrafficSummary = useMemo(() => {
    return getDailyTrafficReport(currentDate);
  }, [currentDate]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setCurrentDate(new Date());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const filteredCorridors = useMemo(() => {
    if (selectedAreaFilter === 'ALL') {
      return trafficData.corridors;
    }
    return trafficData.corridors.filter(c => c.area === selectedAreaFilter);
  }, [trafficData.corridors, selectedAreaFilter]);

  const counts = useMemo(() => {
    const green = trafficData.corridors.filter(c => c.status === 'GREEN').length;
    const yellow = trafficData.corridors.filter(c => c.status === 'YELLOW').length;
    const red = trafficData.corridors.filter(c => c.status === 'RED').length;
    return { green, yellow, red, total: trafficData.corridors.length };
  }, [trafficData.corridors]);

  // Overall Status Theme
  const statusTheme = useMemo(() => {
    if (trafficData.overallStatus === 'RED') {
      return {
        bg: 'from-red-600 via-rose-700 to-[#003B73]',
        badgeBg: 'bg-red-500 text-white',
        border: 'border-red-400/50',
        lightClass: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]',
        accentColor: 'text-red-600',
      };
    }
    if (trafficData.overallStatus === 'YELLOW') {
      return {
        bg: 'from-amber-600 via-yellow-700 to-[#003B73]',
        badgeBg: 'bg-amber-400 text-slate-950 font-black',
        border: 'border-amber-400/50',
        lightClass: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]',
        accentColor: 'text-amber-600',
      };
    }
    return {
      bg: 'from-emerald-700 via-teal-800 to-[#003B73]',
      badgeBg: 'bg-emerald-400 text-slate-950 font-black',
      border: 'border-emerald-400/50',
      lightClass: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]',
      accentColor: 'text-emerald-600',
    };
  }, [trafficData.overallStatus]);

  const openGoogleTrafficMap = (corridorName?: string) => {
    const query = corridorName 
      ? `traffic in ${encodeURIComponent(corridorName + ' Tangerang')}` 
      : 'traffic Tangerang Selatan Alam Sutera';
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@-6.23,106.67,12z/data=!5m1!1e1`, '_blank');
  };

  return (
    <div 
      id="daily-traffic-report-widget"
      className="bg-white rounded-3xl border border-slate-200/90 gopay-shadow overflow-hidden transition-all duration-300"
    >
      {/* 1. Header Banner with Traffic Light Animation */}
      <div className={`bg-gradient-to-r ${statusTheme.bg} p-4 sm:p-5 text-white transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Traffic Light Physical Box Icon + Title */}
          <div className="flex items-start sm:items-center gap-3.5">
            
            {/* Visual Traffic Light Unit */}
            <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-2xl p-2 flex flex-row sm:flex-col items-center justify-center gap-1.5 shrink-0 shadow-lg">
              {/* Red Light */}
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${
                  trafficData.overallStatus === 'RED' 
                    ? 'bg-red-500 shadow-[0_0_12px_#ef4444] scale-110' 
                    : 'bg-red-950/70 opacity-40'
                }`} 
                title="Lampu Merah: Macet"
              />
              {/* Yellow Light */}
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${
                  trafficData.overallStatus === 'YELLOW' 
                    ? 'bg-amber-400 shadow-[0_0_12px_#facc15] scale-110' 
                    : 'bg-amber-950/70 opacity-40'
                }`} 
                title="Lampu Kuning: Padat Merayap"
              />
              {/* Green Light */}
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${
                  trafficData.overallStatus === 'GREEN' 
                    ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] scale-110' 
                    : 'bg-emerald-950/70 opacity-40'
                }`} 
                title="Lampu Hijau: Lancar"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-lg backdrop-blur-xs flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Traffic Monitor Harian</span>
                </span>
                <span className="text-[11px] font-bold text-sky-200">
                  Jabodetabek & Khususnya Tangerang Raya
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black tracking-tight mt-1 text-white flex items-center gap-2">
                {trafficData.statusTitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-100/90 font-medium mt-0.5 max-w-2xl leading-relaxed">
                {trafficData.statusSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Clock */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Perbarui Status Lalu Lintas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => openGoogleTrafficMap()}
              className="px-3.5 py-2.5 bg-white text-[#003B73] hover:bg-sky-50 active:scale-95 text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              title="Buka Peta Live Traffic Google Maps"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Traffic Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-2xl transition-all cursor-pointer"
              title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian Koridor'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Status Indicators Strip */}
        <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 text-slate-100 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-200" />
              <span>{trafficData.peakHourLabel}</span>
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-white/90 text-[11px] font-medium hidden sm:inline">
              🌤️ {trafficData.weatherCondition} — {trafficData.weatherImpact}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {counts.green} Lancar
            </span>
            <span className="bg-amber-500/30 text-amber-100 border border-amber-400/40 px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {counts.yellow} Padat
            </span>
            <span className="bg-red-500/30 text-red-100 border border-red-400/40 px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              {counts.red} Macet
            </span>
          </div>

        </div>
      </div>

      {/* 2. Collapsible Detailed Corridors Breakdown */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
          
          {/* Area Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'ALL', label: 'Semua Koridor (10)' },
                { id: 'TANGSEL', label: '📍 Tangerang Selatan (Tangsel)' },
                { id: 'TANGERANG_KOTA', label: '🏙️ Tangerang Kota' },
                { id: 'TOL_ALSUT', label: '🛣️ Tol Akses ALSUT' },
                { id: 'JABODETABEK', label: '🗺️ Jabodetabek Lintas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedAreaFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAreaFilter === tab.id
                      ? 'bg-[#003B73] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#003B73]" />
              <span>Pusat Hub: Informa Living World ALSUT</span>
            </div>
          </div>

          {/* Grid of Corridors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCorridors.map((corridor) => {
              const isRed = corridor.status === 'RED';
              const isYellow = corridor.status === 'YELLOW';
              const isGreen = corridor.status === 'GREEN';

              return (
                <div
                  key={corridor.id}
                  className={`p-3.5 rounded-2xl border transition-all hover:shadow-sm bg-white flex flex-col justify-between gap-2.5 ${
                    isRed 
                      ? 'border-red-300 bg-red-50/30' 
                      : isYellow 
                      ? 'border-amber-200 bg-amber-50/20' 
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Top: Name and Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#003B73] bg-sky-50 px-2 py-0.5 rounded-md inline-block">
                        {corridor.areaLabel}
                      </span>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 mt-1 leading-snug">
                        {corridor.name}
                      </h4>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isRed && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-300 rounded-xl text-[11px] font-black flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                          <span>🔴 Macet</span>
                        </span>
                      )}
                      {isYellow && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-[11px] font-black flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>🟡 Padat</span>
                        </span>
                      )}
                      {isGreen && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-black flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>🟢 Lancar</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Condition & Speed */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-800 font-semibold text-[11px] line-clamp-1">
                        {corridor.condition}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-extrabold text-slate-700 shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      ~{corridor.speedKmh} km/jam
                    </span>
                  </div>

                  {/* Bottom: Logistic/Sales Notes & Map Link */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 text-[10px] leading-tight line-clamp-1 flex-1">
                      💡 {corridor.notes}
                    </span>
                    <button
                      onClick={() => openGoogleTrafficMap(corridor.name)}
                      className="text-[#003B73] hover:text-sky-700 font-bold text-[10px] flex items-center gap-0.5 shrink-0 hover:underline cursor-pointer"
                    >
                      <span>Cek Map</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Practical Note for Sales & Logistics */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-2xl flex items-start gap-2.5 text-xs text-sky-950">
            <Info className="w-4 h-4 text-[#003B73] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-[#003B73]">Tips Tim Sales Informa Living World ALSUT:</strong>
              <span className="text-slate-700 ml-1">
                Gunakan pantauan traffic light ini saat follow-up WhatsApp dengan customer. Bila customer berada di jalur padat (misal Ciledug, Ciputat, atau Daan Mogot), infokan perkiraan jam kedatangan lebih awal agar customer merasa tenang dan terlayani dengan profesional.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
