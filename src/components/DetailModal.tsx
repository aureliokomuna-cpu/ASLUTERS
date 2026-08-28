import React, { useState } from 'react';
import { 
  X, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Truck, 
  Clock, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck, 
  Store,
  AlertTriangle,
  Navigation,
  Sparkles,
  Send
} from 'lucide-react';
import { DeliveryItem, GroupedReceipt } from '../types';
import { formatIndonesianDate, formatIndonesianDateFull } from '../utils/dateUtils';
import { generateWhatsAppMessage, getWhatsAppUrl, WaGreetingStyle } from '../utils/whatsappUtils';

interface DetailModalProps {
  item: DeliveryItem | null;
  groupedReceipt: GroupedReceipt | null;
  onClose: () => void;
  onFocusMap?: (item: DeliveryItem) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  groupedReceipt,
  onClose,
  onFocusMap
}) => {
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);
  const [waStyle, setWaStyle] = useState<WaGreetingStyle>(
    item?.isUrgentTomorrow ? 'reminder_h1' : item?.isPickupAtStore ? 'pickup_store' : 'genz'
  );

  if (!item) return null;

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(item.receiptNo);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleCopyWaText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWaText(true);
    setTimeout(() => setCopiedWaText(false), 2000);
  };

  const activeWaMessage = generateWhatsAppMessage(item, waStyle);
  const activeWaUrl = getWhatsAppUrl(item.bestPhone, item, waStyle);

  const googleMapsUrl = item.hasValidCoords && item.latitude && item.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + item.cityName)}`;

  const relatedItems = groupedReceipt?.items || [item];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        id="delivery-detail-modal"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header (Informa Blue GoPay Gradient) */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#003B73] via-[#005691] to-[#0284C7] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/20">
              <Package className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-sky-200 font-extrabold uppercase tracking-wider">
                  Detail Pengiriman Informa ALSUT
                </span>
                {item.isUrgentTomorrow && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                    H-1 BESOK
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                No. Receipt: <span className="font-mono text-sky-100">{item.receiptNo}</span>
                <button
                  onClick={handleCopyReceipt}
                  className="text-sky-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="Salin No. Receipt"
                >
                  {copiedReceipt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Status & Timing Banner */}
          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Status Operasional</span>
              <span className="text-sm font-extrabold text-[#003B73] flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  item.status === 'COMPLETED' ? 'bg-emerald-500' :
                  item.isUrgentTomorrow ? 'bg-red-500 animate-ping' :
                  item.status === 'IN_TRANSIT' ? 'bg-sky-600' : 'bg-slate-400'
                }`} />
                {item.statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.isPickupAtStore ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Ambil Sendiri di Toko
                </span>
              ) : (
                <span className="px-3 py-1 bg-sky-100 text-[#003B73] font-bold text-xs rounded-xl border border-sky-200 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#003B73]" /> Delivery ke Alamat
                </span>
              )}
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#003B73] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#003B73]" /> Informasi Pelanggan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Nama Customer</span>
                <strong className="text-base text-slate-900 font-extrabold">{item.customerName}</strong>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">No. Member</span>
                <span className="font-mono text-sm font-bold text-[#003B73]">
                  {item.memberNo || 'Bukan Member / Non-Member'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Nomor HP / Telepon</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {item.bestPhone}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Wilayah / Kota</span>
                <span className="text-sm font-bold text-slate-800">
                  📍 {item.cityName}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 block font-semibold">Alamat Pengiriman Lengkap</span>
              <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {item.address}
              </p>
              {item.addressNotes && (
                <p className="text-xs text-slate-600 mt-1.5 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                  <strong>Patokan:</strong> {item.addressNotes}
                </p>
              )}
            </div>

            {/* Cust Fax / Shipping Notes */}
            {item.shippingNotes && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900">
                <span className="font-bold block text-amber-800">Catatan Khusus Pengiriman & Pasang:</span>
                <p className="mt-0.5 font-medium">{item.shippingNotes}</p>
              </div>
            )}
          </div>

          {/* Automated WhatsApp Chat Section (Informa Living World ALSUT) */}
          <div className="border border-emerald-200 rounded-3xl p-4 sm:p-5 space-y-3.5 bg-gradient-to-b from-emerald-50/60 via-white to-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00AA13] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    Template Chat WhatsApp Otomatis
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Informa Living World ALSUT
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Sapaan disesuaikan umur customer & profesional
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyWaText(activeWaMessage)}
                  className="px-3 py-1 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Salin Teks Pesan"
                >
                  {copiedWaText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWaText ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>

            {/* Template Style Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setWaStyle('genz')}
                className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  waStyle === 'genz'
                    ? 'bg-[#003B73] text-white border-[#003B73] shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">✨ Ramah / Gen-Z</span>
                <span className={`text-[10px] block opacity-80 ${waStyle === 'genz' ? 'text-sky-200' : 'text-slate-500'}`}>
                  "Halo Kak [Nama]"
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWaStyle('formal')}
                className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  waStyle === 'formal'
                    ? 'bg-[#003B73] text-white border-[#003B73] shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">👔 Formal / Dewasa</span>
                <span className={`text-[10px] block opacity-80 ${waStyle === 'formal' ? 'text-sky-200' : 'text-slate-500'}`}>
                  "Bapak/Ibu [Nama]"
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWaStyle('reminder_h1')}
                className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  waStyle === 'reminder_h1'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">🚨 Reminder H-1</span>
                <span className={`text-[10px] block opacity-80 ${waStyle === 'reminder_h1' ? 'text-red-100' : 'text-slate-500'}`}>
                  Pengiriman Besok
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWaStyle('pickup_store')}
                className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  waStyle === 'pickup_store'
                    ? 'bg-[#003B73] text-white border-[#003B73] shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">🏬 Ambil di Toko</span>
                <span className={`text-[10px] block opacity-80 ${waStyle === 'pickup_store' ? 'text-sky-200' : 'text-slate-500'}`}>
                  Pickup Point Toko
                </span>
              </button>
            </div>

            {/* Live Message Preview Box */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans shadow-inner max-h-48 overflow-y-auto">
              {activeWaMessage}
            </div>

            {/* Action Bar */}
            {activeWaUrl && (
              <a
                href={activeWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#00AA13] hover:bg-[#009110] text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Buka & Kirim Chat via WhatsApp</span>
              </a>
            )}
          </div>

          {/* Logistics & Dates Breakdown */}
          <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#003B73] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#003B73]" /> Jadwal & Logistik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block font-semibold">Tanggal Transaksi</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {formatIndonesianDate(item.transactionDate, item.transactionDateRaw)}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block font-semibold">Jadwal Pengiriman</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {formatIndonesianDate(item.deliveryScheduleDate, item.deliveryScheduleRaw)}
                </span>
              </div>

              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 text-[#003B73]">
                <span className="text-[11px] text-[#003B73] font-bold block">Target Instalasi</span>
                <span className="font-black text-xs mt-0.5 block">
                  {formatIndonesianDate(item.installScheduleDate, item.installScheduleRaw)}
                </span>
              </div>
            </div>

            {/* Internal Tracking Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">No. Transaksi</span>
                <span className="font-mono font-bold text-slate-700">{item.transactionNo || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Surat Jalan (SJ)</span>
                <span className="font-mono font-bold text-slate-700">{item.installNo || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Installer Pool</span>
                <span className="font-bold text-slate-700">{item.installerPoolId || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Ekspedisi/Channel</span>
                <span className="font-bold text-slate-700">{item.typeOrder || item.deliveryId || 'Ownfleet ALSUT'}</span>
              </div>
            </div>
          </div>

          {/* Partial Deliveries / Related rows under same Receipt */}
          {relatedItems.length > 1 && (
            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#003B73] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#003B73]" /> Pengiriman Parsial ({relatedItems.length} Baris)
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Satu Receipt memiliki multi-jadwal</span>
              </div>

              <div className="space-y-2">
                {relatedItems.map((subItem, idx) => (
                  <div 
                    key={subItem.id} 
                    className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">Pengiriman #{idx + 1}</span>
                      <span className="text-slate-500 ml-2 font-mono">SJ: {subItem.installNo}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        Kirim: <strong>{formatIndonesianDate(subItem.deliveryScheduleDate)}</strong>
                      </span>
                      <span className="text-[#003B73]">
                        Pasang: <strong>{formatIndonesianDate(subItem.installScheduleDate)}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#003B73] font-bold">
                        {subItem.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {(activeWaUrl || item.waLink) && (
              <a
                href={activeWaUrl || item.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-extrabold bg-[#00AA13] hover:bg-[#009110] text-white rounded-2xl transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold bg-white hover:bg-slate-100 text-[#003B73] rounded-2xl border border-slate-200 transition-colors"
            >
              <Navigation className="w-4 h-4 text-[#003B73]" />
              <span>Buka Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {item.hasValidCoords && onFocusMap && (
              <button
                onClick={() => {
                  onFocusMap(item);
                  onClose();
                }}
                className="px-3.5 py-2.5 text-xs sm:text-sm font-bold bg-sky-50 hover:bg-sky-100 text-[#003B73] rounded-2xl border border-sky-200 transition-colors cursor-pointer"
              >
                📍 Lihat di Peta App
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-extrabold bg-[#003B73] hover:bg-[#002D5A] text-white rounded-2xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
