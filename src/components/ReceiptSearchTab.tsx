import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Search, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  Phone, 
  Navigation, 
  ExternalLink, 
  Layers,
  ArrowRight,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { DeliveryItem, GroupedReceipt } from '../types';
import { formatIndonesianDate, formatIndonesianDateFull } from '../utils/dateUtils';

interface ReceiptSearchTabProps {
  groupedByReceipt: Map<string, GroupedReceipt>;
  allItems: DeliveryItem[];
  initialSearchQuery?: string;
  onViewDetail: (item: DeliveryItem) => void;
}

export const ReceiptSearchTab: React.FC<ReceiptSearchTabProps> = ({
  groupedByReceipt,
  allItems,
  initialSearchQuery = '',
  onViewDetail,
}) => {
  const [query, setQuery] = useState(initialSearchQuery);
  const [activeReceipt, setActiveReceipt] = useState<GroupedReceipt | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);

  // Sync initial search query if changed externally (e.g. from header search)
  useEffect(() => {
    if (initialSearchQuery) {
      setQuery(initialSearchQuery);
      performSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const performSearch = (searchKey: string) => {
    const cleanKey = searchKey.trim().toLowerCase();
    if (!cleanKey) {
      setActiveReceipt(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // 1. Direct match on Receipt No
    for (const [recNo, group] of groupedByReceipt.entries()) {
      if (recNo.toLowerCase() === cleanKey) {
        setActiveReceipt(group);
        return;
      }
    }

    // 2. Partial match on Receipt No
    for (const [recNo, group] of groupedByReceipt.entries()) {
      if (recNo.toLowerCase().includes(cleanKey)) {
        setActiveReceipt(group);
        return;
      }
    }

    // 3. Fallback match by Customer Name or Phone
    for (const group of groupedByReceipt.values()) {
      if (
        group.customerName.toLowerCase().includes(cleanKey) ||
        group.bestPhone.toLowerCase().includes(cleanKey) ||
        group.memberNo.toLowerCase().includes(cleanKey)
      ) {
        setActiveReceipt(group);
        return;
      }
    }

    // Not found
    setActiveReceipt(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // Mini Map Effect with OSM Basemap
  useEffect(() => {
    if (!activeReceipt || !activeReceipt.hasValidCoords || !activeReceipt.latitude || !activeReceipt.longitude) {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
      return;
    }

    if (miniMapContainerRef.current) {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
      }

      const map = L.map(miniMapContainerRef.current, {
        center: [activeReceipt.latitude, activeReceipt.longitude],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="w-8 h-8 rounded-full bg-orange-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs transform -translate-x-1/2 -translate-y-1/2">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([activeReceipt.latitude, activeReceipt.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs">
            <strong class="text-slate-900 block font-bold">${activeReceipt.customerName}</strong>
            <span class="text-slate-600 text-[11px] block mt-0.5">${activeReceipt.address}</span>
          </div>
        `)
        .openPopup();

      miniMapRef.current = map;

      // Invalidate size to ensure full rendering
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (miniMapRef.current) {
          miniMapRef.current.remove();
          miniMapRef.current = null;
        }
      };
    }
  }, [activeReceipt]);

  // Sample quick receipts for suggestions
  const sampleReceipts: GroupedReceipt[] = (Array.from(groupedByReceipt.values()) as GroupedReceipt[]).slice(0, 5);

  const primaryItem = activeReceipt?.items[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Search Header Hero (Informa Blue GoPay Gradient) */}
      <div className="bg-gradient-to-br from-[#003B73] via-[#005691] to-[#0284C7] rounded-3xl p-6 sm:p-8 text-white gopay-shadow">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Pencarian No. Receipt Transaksi
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 font-medium">
            Ketik atau scan nomor receipt customer untuk melihat status tracking live & rincian pengiriman logistik.
          </p>
        </div>

        {/* Big Search Input Form */}
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#003B73] absolute left-4 pointer-events-none" />
            <input
              id="search-tab-receipt-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  setActiveReceipt(null);
                  setHasSearched(false);
                }
              }}
              placeholder="Masukkan No. Receipt (mis. 240801... atau nama customer)..."
              className="w-full pl-12 pr-28 sm:pr-32 py-4 bg-white/95 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl border-2 border-white/40 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/30 text-sm sm:text-base font-bold transition-all outline-hidden shadow-lg"
            />
            <button
              type="submit"
              id="search-submit-btn"
              className="absolute right-2 px-5 py-2.5 bg-[#003B73] hover:bg-[#002D5A] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Cari</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="mt-5 text-center text-xs text-sky-200 flex flex-wrap items-center justify-center gap-2">
          <span className="font-bold text-white">Contoh Receipt:</span>
          {sampleReceipts.map((sample) => (
            <button
              key={sample.receiptNo}
              onClick={() => {
                setQuery(sample.receiptNo);
                performSearch(sample.receiptNo);
              }}
              className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-sky-100 font-mono text-xs transition-colors cursor-pointer border border-white/20 backdrop-blur-xs font-bold"
            >
              #{sample.receiptNo}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && !activeReceipt && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 gopay-shadow animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[#003B73] flex items-center justify-center mx-auto mb-4 border border-sky-100">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">No. Receipt Tidak Ditemukan</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Tidak ditemukan data transaksi untuk pencarian <strong className="text-slate-800">"{query}"</strong>. 
            Pastikan nomor receipt atau nama customer sudah sesuai dengan lembar struk Informa.
          </p>
        </div>
      )}

      {/* Found Receipt Details Card */}
      {activeReceipt && primaryItem && (
        <div className="bg-white rounded-3xl border border-slate-200/80 gopay-shadow overflow-hidden animate-fade-in space-y-0">
          
          {/* Result Card Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-50/80 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#003B73] text-white flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-sky-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-[#003B73] uppercase tracking-wider">
                    Hasil Pencarian
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black ${
                    activeReceipt.overallStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    activeReceipt.hasUrgentH1 ? 'bg-red-500 text-white animate-bounce' :
                    'bg-sky-100 text-[#003B73]'
                  }`}>
                    {primaryItem.statusLabel}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Receipt: <span className="font-mono text-[#003B73]">#{activeReceipt.receiptNo}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {primaryItem.waLink && (
                <a
                  href={primaryItem.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-[#00AA13] hover:bg-[#009110] text-white rounded-2xl transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat WA</span>
                </a>
              )}

              <button
                onClick={() => onViewDetail(primaryItem)}
                className="px-4 py-2 text-xs font-extrabold bg-[#003B73] hover:bg-[#002D5A] text-white rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                Lihat Detail Lengkap
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Visual Stepper if in transit */}
            {primaryItem.status !== 'COMPLETED' && (
              <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-4">
                  <span>Progres Live Tracking:</span>
                  <span className="text-[#003B73] bg-sky-50 px-2 py-0.5 rounded-md">{primaryItem.statusLabel}</span>
                </div>

                <div className="relative pt-6 pb-2 px-2">
                  <div className="absolute top-8 left-4 right-4 h-1.5 bg-slate-200 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-[#003B73] via-[#0284C7] to-sky-400 rounded-full"
                      style={{ width: `${primaryItem.progressPercent}%` }}
                    />
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    {[
                      { label: 'Order', date: primaryItem.transactionDate },
                      { label: 'Hub ALSUT', date: null },
                      { label: 'Kirim', date: primaryItem.deliveryScheduleDate },
                      { label: 'Tiba', date: null },
                      { label: 'Instalasi', date: primaryItem.installScheduleDate },
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center max-w-[70px]">
                        <div className="w-4 h-4 rounded-full bg-[#003B73] border-2 border-white ring-2 ring-sky-300" />
                        <span className="text-[11px] font-bold text-slate-800 mt-2">{step.label}</span>
                        <span className="text-[10px] text-slate-400">{formatIndonesianDate(step.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Customer & Dates */}
              <div className="space-y-4">
                <div className="border border-slate-200/80 p-4 sm:p-5 rounded-3xl space-y-3 bg-white">
                  <span className="text-xs font-black text-[#003B73] uppercase tracking-wider block">
                    Pelanggan & Kontak
                  </span>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{activeReceipt.customerName}</h4>
                    {activeReceipt.memberNo && (
                      <p className="text-xs text-[#003B73] font-bold font-mono">Member: {activeReceipt.memberNo}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><strong>No. HP:</strong> {activeReceipt.bestPhone}</p>
                    <p><strong>Wilayah:</strong> {activeReceipt.cityName}</p>
                  </div>
                </div>

                <div className="border border-slate-200/80 p-4 sm:p-5 rounded-3xl space-y-3 bg-white">
                  <span className="text-xs font-black text-[#003B73] uppercase tracking-wider block">
                    Alamat Lengkap Tujuan
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {activeReceipt.address}
                  </p>
                  {primaryItem.shippingNotes && (
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-950 font-medium">
                      <strong className="text-amber-800">Catatan Pengiriman:</strong> {primaryItem.shippingNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Mini Map */}
              <div className="border border-slate-200/80 p-4 sm:p-5 rounded-3xl flex flex-col justify-between space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#003B73] uppercase tracking-wider">
                    Lokasi Alamat (Mini Map)
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeReceipt.address + ', ' + activeReceipt.cityName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#003B73] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-[#003B73]" />
                  </a>
                </div>

                {activeReceipt.hasValidCoords ? (
                  <div className="h-44 rounded-2xl overflow-hidden border border-slate-200 relative">
                    <div ref={miniMapContainerRef} className="w-full h-full" />
                  </div>
                ) : (
                  <div className="h-44 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                    <MapPin className="w-6 h-6 text-slate-300 mb-1" />
                    <span>Koordinat belum terdata otomatis</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeReceipt.address + ', ' + activeReceipt.cityName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[#003B73] font-bold underline"
                    >
                      Cari Alamat di Google Maps →
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">Tgl Pengiriman</span>
                    <span className="font-bold text-slate-800">
                      {formatIndonesianDate(primaryItem.deliveryScheduleDate)}
                    </span>
                  </div>
                  <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-[#003B73]">
                    <span className="text-[#003B73] text-[10px] block font-bold">Tgl Instalasi</span>
                    <span className="font-black">
                      {formatIndonesianDate(primaryItem.installScheduleDate)}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Partial items list if multiple lines under same receipt */}
            {activeReceipt.items.length > 1 && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-[#003B73] uppercase tracking-wider">
                  Rincian Baris Pengiriman ({activeReceipt.items.length} Baris Parsial)
                </h4>
                <div className="space-y-2">
                  {activeReceipt.items.map((sub, idx) => (
                    <div 
                      key={sub.id}
                      className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Baris #{idx + 1}</span>
                        <span className="font-mono text-slate-500 font-bold">SJ: {sub.installNo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Kirim: <strong>{formatIndonesianDate(sub.deliveryScheduleDate)}</strong></span>
                        <span className="text-[#003B73]">Pasang: <strong>{formatIndonesianDate(sub.installScheduleDate)}</strong></span>
                        <button
                          onClick={() => onViewDetail(sub)}
                          className="font-bold text-[#003B73] hover:underline"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
