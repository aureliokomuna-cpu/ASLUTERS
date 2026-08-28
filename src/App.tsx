import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, BottomNav, ActiveTab } from './components/Navigation';
import { TrackingTab } from './components/TrackingTab';
import { CustomerDatabaseTab } from './components/CustomerDatabaseTab';
import { ReceiptSearchTab } from './components/ReceiptSearchTab';
import { DetailModal } from './components/DetailModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchAndParseDeliveryData } from './utils/csvParser';
import { DeliveryItem, GroupedReceipt } from './types';
import { Loader2, AlertCircle, RefreshCw, Truck } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<DeliveryItem[]>([]);
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

  // Load Data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAndParseDeliveryData();
      setItems(data.items);
      setGroupedByReceipt(data.groupedByReceipt);
      setCities(data.cities);
      setLastUpdated(data.lastUpdated);
    } catch (err: any) {
      console.error('Error fetching delivery data:', err);
      setError(err?.message || 'Gagal memuat data dari Google Sheets. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts for tabs & KPI
  const activeCount = useMemo(() => items.filter((i) => i.status === 'IN_TRANSIT').length, [items]);
  const waitingCount = useMemo(() => items.filter((i) => i.status === 'WAITING_SCHEDULE').length, [items]);
  const completedCount = useMemo(() => items.filter((i) => i.status === 'COMPLETED').length, [items]);
  const urgentH1Count = useMemo(() => items.filter((i) => i.status === 'IN_TRANSIT' && i.isUrgentTomorrow).length, [items]);

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
          {isLoading && items.length === 0 && (
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
          {error && !isLoading && items.length === 0 && (
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
          {!isLoading && items.length > 0 && activeTab === 'TRACKING' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Live Tracking">
              <TrackingTab
                items={items}
                cities={cities}
                onViewDetail={(item) => setSelectedDetailItem(item)}
                onFocusMap={handleFocusMap}
                initialFilterH1={filterH1Trigger}
              />
            </ErrorBoundary>
          )}

          {/* Tab 2: Database Customer */}
          {!isLoading && items.length > 0 && activeTab === 'DATABASE' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Database Customer">
              <CustomerDatabaseTab
                items={items}
                cities={cities}
                onViewDetail={(item) => setSelectedDetailItem(item)}
                selectedMapItem={selectedMapItem}
                onSelectMapItem={setSelectedMapItem}
              />
            </ErrorBoundary>
          )}

          {/* Tab 3: Search No. Receipt */}
          {!isLoading && items.length > 0 && activeTab === 'SEARCH' && (
            <ErrorBoundary fallbackTitle="Gagal memuat tab Pencarian Receipt">
              <ReceiptSearchTab
                groupedByReceipt={groupedByReceipt}
                allItems={items}
                initialSearchQuery={searchQuery}
                onViewDetail={(item) => setSelectedDetailItem(item)}
              />
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
