import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Store,
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';
import { DeliveryItem, FilterOptions } from '../types';
import { DeliveryCard } from './DeliveryCard';
import { formatIndonesianDate } from '../utils/dateUtils';

interface TrackingTabProps {
  items: DeliveryItem[];
  cities: string[];
  onViewDetail: (item: DeliveryItem) => void;
  onFocusMap: (item: DeliveryItem) => void;
  initialFilterH1?: boolean;
}

export const TrackingTab: React.FC<TrackingTabProps> = ({
  items,
  cities,
  onViewDetail,
  onFocusMap,
  initialFilterH1 = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'H1_ONLY' | 'TODAY_ONLY' | 'EXPEDITION_ONLY'>(
    initialFilterH1 ? 'H1_ONLY' : 'ALL'
  );
  const [sortBy, setSortBy] = useState<'NEAREST_DATE' | 'FURTHEST_DATE' | 'CUSTOMER_NAME' | 'RECEIPT_NO'>('NEAREST_DATE');
  const [pickupFilter, setPickupFilter] = useState<'ALL' | 'DELIVERY_ONLY' | 'PICKUP_ONLY'>('ALL');
  const [showWaitingSection, setShowWaitingSection] = useState(false);

  // Separate active in-transit items and waiting schedule items
  const activeItems = useMemo(() => {
    return items.filter((item) => item.status === 'IN_TRANSIT');
  }, [items]);

  const waitingItems = useMemo(() => {
    return items.filter((item) => item.status === 'WAITING_SCHEDULE');
  }, [items]);

  // Urgent H-1 items count
  const urgentH1List = useMemo(() => {
    return activeItems.filter((item) => item.isUrgentTomorrow);
  }, [activeItems]);

  const todayList = useMemo(() => {
    return activeItems.filter((item) => item.isToday);
  }, [activeItems]);

  // Filtered & Sorted Active Deliveries
  const filteredActiveItems = useMemo(() => {
    return activeItems.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          item.receiptNo.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.bestPhone.toLowerCase().includes(q) ||
          item.transactionNo.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // City
      if (selectedCity !== 'ALL') {
        if (item.cityName.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'H1_ONLY' && !item.isUrgentTomorrow) return false;
      if (statusFilter === 'TODAY_ONLY' && !item.isToday) return false;
      if (statusFilter === 'EXPEDITION_ONLY' && !item.typeOrder && !item.deliveryId) return false;

      // Pickup
      if (pickupFilter === 'DELIVERY_ONLY' && item.isPickupAtStore) return false;
      if (pickupFilter === 'PICKUP_ONLY' && !item.isPickupAtStore) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEAREST_DATE') {
        const timeA = a.installScheduleDate?.getTime() ?? Infinity;
        const timeB = b.installScheduleDate?.getTime() ?? Infinity;
        return timeA - timeB;
      }
      if (sortBy === 'FURTHEST_DATE') {
        const timeA = a.installScheduleDate?.getTime() ?? -Infinity;
        const timeB = b.installScheduleDate?.getTime() ?? -Infinity;
        return timeB - timeA;
      }
      if (sortBy === 'CUSTOMER_NAME') {
        return a.customerName.localeCompare(b.customerName);
      }
      if (sortBy === 'RECEIPT_NO') {
        return a.receiptNo.localeCompare(b.receiptNo);
      }
      return 0;
    });
  }, [activeItems, searchQuery, selectedCity, statusFilter, pickupFilter, sortBy]);

  // Filtered Waiting Items
  const filteredWaitingItems = useMemo(() => {
    return waitingItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.receiptNo.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q)
        );
      }
      if (selectedCity !== 'ALL') {
        return item.cityName.toLowerCase() === selectedCity.toLowerCase();
      }
      return true;
    });
  }, [waitingItems, searchQuery, selectedCity]);

  return (
    <div className="space-y-6">
      
      {/* 1. Urgent H-1 Alert Banner */}
      {urgentH1List.length > 0 && (
        <div 
          id="urgent-h1-alert-banner"
          className="bg-gradient-to-r from-red-600 via-rose-600 to-[#003B73] rounded-3xl p-4 sm:p-5 text-white gopay-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-400/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base tracking-tight uppercase">
                  Peringatan Jadwal Instalasi Besok (H-1)
                </span>
                <span className="bg-white text-red-600 text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {urgentH1List.length} Order Perlu Aksi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 mt-0.5 font-medium">
                Pastikan muatan logistik ALSUT siap & konfirmasi kehadiran ke customer sekarang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {statusFilter === 'H1_ONLY' ? (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Tampilkan Semua Order
              </button>
            ) : (
              <button
                onClick={() => setStatusFilter('H1_ONLY')}
                className="px-4 py-2.5 bg-white text-red-600 hover:bg-red-50 active:scale-95 font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Filter Khusus H-1</span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Filter & Search Controls (GoPay Style Card) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 gopay-shadow space-y-4">
        
        {/* Row 1: Search and City Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#003B73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="tracking-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Receipt, Nama Customer, No. HP, atau Alamat..."
              className="w-full pl-10 pr-12 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 focus:border-[#003B73] focus:ring-2 focus:ring-sky-200 transition-all outline-hidden"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* City select dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                id="tracking-city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter Kota Tujuan"
                className="w-full sm:w-48 pl-3 pr-8 py-2.5 bg-slate-50/80 hover:bg-slate-100 text-xs font-bold text-slate-800 rounded-2xl border border-slate-200 focus:border-[#003B73] focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer outline-hidden"
              >
                <option value="ALL">Semua Kota / Wilayah</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-[#003B73] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Select */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                id="tracking-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan Pengiriman"
                className="w-full sm:w-48 pl-3 pr-8 py-2.5 bg-slate-50/80 hover:bg-slate-100 text-xs font-bold text-slate-800 rounded-2xl border border-slate-200 focus:border-[#003B73] focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer outline-hidden"
              >
                <option value="NEAREST_DATE">Jadwal Pasang Terdekat</option>
                <option value="FURTHEST_DATE">Jadwal Pasang Terjauh</option>
                <option value="CUSTOMER_NAME">Nama Customer (A-Z)</option>
                <option value="RECEIPT_NO">No. Receipt</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-[#003B73] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Row 2: Status Quick Filter Chips (GoPay Superapp Pill Style) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#003B73]" /> Status:
            </span>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Aktif ({activeItems.length})
            </button>

            {urgentH1List.length > 0 && (
              <button
                onClick={() => setStatusFilter('H1_ONLY')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'H1_ONLY'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Instalasi Besok ({urgentH1List.length})</span>
              </button>
            )}

            {todayList.length > 0 && (
              <button
                onClick={() => setStatusFilter('TODAY_ONLY')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'TODAY_ONLY'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Ini ({todayList.length})</span>
              </button>
            )}

            <button
              onClick={() => setStatusFilter('EXPEDITION_ONLY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'EXPEDITION_ONLY'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ekspedisi (RupaRupa / J&T)
            </button>
          </div>

          {/* Delivery vs Store Pickup Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setPickupFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pickupFilter === 'ALL' ? 'bg-white text-[#003B73] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setPickupFilter('DELIVERY_ONLY')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pickupFilter === 'DELIVERY_ONLY' ? 'bg-white text-[#003B73] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🚚 Kirim
            </button>
            <button
              onClick={() => setPickupFilter('PICKUP_ONLY')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pickupFilter === 'PICKUP_ONLY' ? 'bg-white text-[#003B73] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🏠 Ambil Toko
            </button>
          </div>

        </div>

      </div>

      {/* 3. Deliveries Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#003B73] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
              Daftar Pengiriman Aktif
            </h2>
            <span className="text-xs font-black bg-sky-50 text-[#003B73] border border-sky-200 px-3 py-0.5 rounded-full">
              {filteredActiveItems.length} Order
            </span>
          </div>

          <span className="text-xs text-slate-400 font-semibold hidden sm:block">
            Tracking live logistik Informa ALSUT
          </span>
        </div>

        {filteredActiveItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 gopay-shadow">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-base">Tidak ada pengiriman yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Coba sesuaikan kata kunci pencarian, filter wilayah kota, atau pilih status lain.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('ALL');
                setStatusFilter('ALL');
                setPickupFilter('ALL');
              }}
              className="mt-4 px-5 py-2 text-xs font-extrabold bg-[#003B73] hover:bg-[#002D5A] active:scale-95 text-white rounded-2xl transition-all shadow-xs cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredActiveItems.map((item) => (
              <DeliveryCard
                key={item.id}
                item={item}
                onViewDetail={onViewDetail}
                onFocusMap={onFocusMap}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. "Menunggu Jadwal Instalasi" Section */}
      <div className="bg-sky-50/50 rounded-3xl border border-sky-200/80 p-4 sm:p-5 gopay-shadow">
        <div 
          onClick={() => setShowWaitingSection(!showWaitingSection)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#003B73] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Menunggu Konfirmasi Jadwal Instalasi
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-black bg-sky-200 text-[#003B73] rounded-full">
                  {waitingItems.length} Order
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Order yang jadwal instalasinya belum ditentukan (placeholder 1/1/1900).
              </p>
            </div>
          </div>

          <button className="p-2 text-[#003B73] hover:bg-sky-100 rounded-xl transition-colors">
            {showWaitingSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Collapsible List of Waiting Items */}
        {showWaitingSection && (
          <div className="mt-4 pt-4 border-t border-sky-200/60 space-y-3">
            <p className="text-xs text-slate-600 font-medium italic">
              * Hubungi customer untuk mengonfirmasi tanggal ketersediaan penerimaan dan perakitan furniture.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWaitingItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#003B73] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-black text-[#003B73]">#{item.receiptNo}</span>
                      <span className="text-[11px] bg-sky-50 text-[#003B73] px-2 py-0.5 rounded-lg font-bold">
                        📍 {item.cityName}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800">{item.customerName}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.address}</p>
                    
                    {item.shippingNotes && (
                      <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-xl mt-2 font-medium border border-amber-200">
                        📝 {item.shippingNotes}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    {item.waLink ? (
                      <a 
                        href={item.waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#00AA13] hover:underline font-extrabold flex items-center gap-1"
                      >
                        💬 Chat WA
                      </a>
                    ) : <span></span>}

                    <button
                      onClick={() => onViewDetail(item)}
                      className="text-xs font-black text-[#003B73] hover:text-[#005691] cursor-pointer"
                    >
                      Lihat Detail →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
