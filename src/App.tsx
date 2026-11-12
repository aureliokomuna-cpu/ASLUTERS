import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, BottomNav, ActiveTab } from './components/Navigation';
import { TrackingTab } from './components/TrackingTab';
import { CustomerDatabaseTab } from './components/CustomerDatabaseTab';
import { ReceiptSearchTab } from './components/ReceiptSearchTab';
import { TrafficTab } from './components/TrafficTab';
import { DetailModal } from './components/DetailModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchAndParseDeliveryData, fetchAndParse2025Data } from './utils/csvParser';
import { DeliveryItem, GroupedReceipt } from './types';
import { Loader2, AlertCircle, RefreshCw, Truck } from 'lucide-react';

export default function App() {
  const [items2026, setItems2026] = useState<DeliveryItem[]>([]);
  const [items2025, setItems2025] = useState<DeliveryItem[]>([]);
  const [liveStats2025, setLiveStats2025] = useState<Record<string, Record<number, number>> | undefined>(undefined);
  const [isLoading2025, setIsLoading2025] = useState<boolean>(false);
  const [is2025Loaded, setIs2025Loaded] = useState<boolean>(false);

  const [groupedByReceipt, setGroupedByReceipt] = useState<Map<string, GroupedReceipt>>(new Map());
  const [cities, setCities] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('TRACKING');
  const [selectedDetailItem, setSelectedDetailItem] = useState<DeliveryItem | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<DeliveryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterH1Trigger, setFilterH1Trigger] = useState<boolean>(false);

  // Load 2025 live comparison data from Tab 2
  const load2025Data = useCallback(async () => {
    setIsLoading2025(true);
    try {
      const data2025 = await fetchAndParse2025Data();
      setItems2025(data2025.items);
      setLiveStats2025(data2025.cityMonthCounts);
      setIs2025Loaded(true);
    } catch (err) {
      console.warn('Gagal memuat live data 2025 pembanding, fallback ke baseline:', err);
    } finally {
      setIsLoading2025(false);
    }
  }, []);

  // Load 2026 Live Tracking & Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAndParseDeliveryData();
      setItems2026(data.items);
      setGroupedByReceipt(data.groupedByReceipt);
      setCities(data.cities);
      setLastUpdated(data.lastUpdated);
      // Immediately start background fetch of 2025 live comparison data
      load2025Data();
    } catch (err: any) {
      console.error('Error fetching delivery data:', err);
      setError(err?.message || 'Gagal memuat data dari Google Sheets. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  }, [load2025Data]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combined items for Database and Search
  const combinedItems = useMemo(() => {
    return [...items2026, ...items2025];
  }, [items2026, items2025]);

  const allCities = useMemo(() => {
    const set = new Set<string>(cities);
    items2025.forEach((i) => {
      if (i.cityName) set.add(i.cityName);
    });
    return Array.from(set).sort();
  }, [cities, items2025]);

  // Counts for tabs & KPI (reflects current 2026 operational status)
  const activeCount = useMemo(() => items2026.filter((i) => i.status === 'IN_TRANSIT').length, [items2026]);
  const waitingCount = useMemo(() => items2026.filter((i) => i.status === 'WAITING_SCHEDULE').length, [items2026]);
  const completedCount = useMemo(() => items2026.filter((i) => i.status === 'COMPLETED').length, [items2026]);
  const urgentH1Count = useMemo(() => items2026.filter((i) => i.status === 'IN_TRANSIT' && i.isUrgentTomorrow).length, [items2026]);

  // Handlers
  const handleHeaderSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('SEARCH');
  };

  const handleSelectUrgent = () => {
    setFilterH1Trigger(true);
    setActiveTab('TRACKING');
  };

  const handleFocusMap = (item: DeliveryItem) => {
    setSelectedMapItem(item);
    setActiveTab('DATABASE');
  };

  const currentGroup = selectedDetailItem 
    ? groupedByReceipt.get(selectedDetailItem.receiptNo) || null 
    : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-orange-500 selection:text-white pb-16 md:pb-0">
      
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={loadData}
        onSearch={handleHeaderSearch}
        activeCount={activeCount}
        waitingCount={waitingCount}
        completedCount={completedCount}
        urgentH1Count={urgentH1Count}
        onSelectUrgent={handleSelectUrgent}
        onOpenTraffic={() => setActiveTab('TRAFFIC')}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab !== 'TRACKING') setFilterH1Trigger(false);
            }}
            activeCount={activeCount}
            completedCount={completedCount}
            urgentH1Count={urgentH1Count}
          />
        </div>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* Loading State */}
          {isLoading && items2026.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Menghubungkan ke Google Sheets...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                Mengambil data pengiriman & instalasi live toko Informa Alam Sutera.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && items2026.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-red-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Gagal Mengambil Data
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">
                {error}
              </p>
              <button
                onClick={loadData}
                className="mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Tab 1: Live Tracking */}
          {!isLoading && items2026.length > 0 && activeTab === 'TRACKING' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Live Tracking">
              <TrackingTab
                items={items2026}
                cities={cities}
                onViewDetail={(item) => setSelectedDetailItem(item)}
                onFocusMap={handleFocusMap}
                initialFilterH1={filterH1Trigger}
              />
            </ErrorBoundary>
          )}

          {/* Tab 2: Database Customer (Supports 2026 Live + 2025 Pembanding) */}
          {!isLoading && items2026.length > 0 && activeTab === 'DATABASE' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Database Customer">
              <CustomerDatabaseTab
                items={combinedItems}
                cities={allCities}
                onViewDetail={(item) => setSelectedDetailItem(item)}
                selectedMapItem={selectedMapItem}
                onSelectMapItem={setSelectedMapItem}
                is2025Loading={isLoading2025}
                is2025Loaded={is2025Loaded}
                liveStats2025={liveStats2025}
                onRefresh2025={load2025Data}
                items2026Count={items2026.length}
                items2025Count={items2025.length}
              />
            </ErrorBoundary>
          )}

          {/* Tab 3: Search No. Receipt */}
          {!isLoading && items2026.length > 0 && activeTab === 'SEARCH' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Pencarian Receipt">
              <ReceiptSearchTab
                groupedByReceipt={groupedByReceipt}
                allItems={combinedItems}
                initialSearchQuery={searchQuery}
                onViewDetail={(item) => setSelectedDetailItem(item)}
              />
            </ErrorBoundary>
          )}

          {/* Tab 4: Pantauan Traffic Jam Jabodetabek & Tangsel */}
          {!isLoading && activeTab === 'TRAFFIC' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Pantauan Traffic">
              <TrafficTab />
            </ErrorBoundary>
          )}

          {/* Footnote */}
          <footer className="mt-10 pt-5 pb-14 md:pb-6 border-t border-slate-200/80 text-center">
            <p className="text-xs font-bold text-slate-700">
              Dibuat oleh Anak Buah AM Fatah
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Informa Living World Alam Sutera • Sistem Monitoring Logistik & Instalasi
            </p>
          </footer>

        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'TRACKING') setFilterH1Trigger(false);
        }}
        activeCount={activeCount}
        completedCount={completedCount}
        urgentH1Count={urgentH1Count}
      />

      {/* Detail Modal */}
      {selectedDetailItem && (
        <DetailModal
          item={selectedDetailItem}
          groupedReceipt={currentGroup}
          onClose={() => setSelectedDetailItem(null)}
          onFocusMap={handleFocusMap}
        />
      )}

    </div>
  );
}
