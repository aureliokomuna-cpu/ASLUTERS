import React from 'react';
import { TrafficReportWidget } from './TrafficReportWidget';
import { 
  Navigation, 
  ExternalLink, 
  ShieldCheck, 
  Car, 
  MapPin, 
  Clock, 
  PhoneCall, 
  MessageCircle,
  Building2,
  Sparkles,
  Info
} from 'lucide-react';

export const TrafficTab: React.FC = () => {
  const openDirectTraffic = (query: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@-6.235,106.67,12z/data=!5m1!1e1`, '_blank');
  };

  const directCorridors = [
    {
      title: 'Exit Tol Alam Sutera (KM 15)',
      desc: 'Akses langsung dari Tol Jakarta - Merak ke Living World ALSUT',
      query: 'Exit Tol Alam Sutera Jakarta Merak',
      icon: '🛣️'
    },
    {
      title: 'Jl. Raya Serpong (Living World Hub)',
      desc: 'Jalur arteri utama depan Informa Living World Alam Sutera',
      query: 'Jalan Raya Serpong Living World Alam Sutera',
      icon: '🏬'
    },
    {
      title: 'Tol JORR 2 / Kunciran - Serpong',
      desc: 'Akses penghubung cepat Bandara Soetta & Jakarta Selatan',
      query: 'Tol Kunciran Serpong',
      icon: '🚗'
    },
    {
      title: 'Kawasan BSD City & Gading Serpong',
      desc: 'Boulevard utama perumahan dan klaster customer Informa',
      query: 'Boulevard Gading Serpong Tangerang',
      icon: '🏘️'
    },
    {
      title: 'Koridor Ciledug Raya - Bintaro',
      desc: 'Jalur padat Tangerang - Jakarta Selatan',
      query: 'Jalan Ciledug Raya Tangerang',
      icon: '🛵'
    },
    {
      title: 'Koridor Ciputat - Pamulang',
      desc: 'Akses Tangerang Selatan arah Lebak Bulus & Pondok Indah',
      query: 'Jalan Ir H Juanda Ciputat Tangerang Selatan',
      icon: '🚦'
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner khusus Menu Traffic */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 gopay-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Pantauan Traffic Jam & Kondisi Jalan
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Menu Khusus
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                Monitoring live kondisi kemacetan Jabodetabek khususnya jalur distribusi Tangerang & Tangerang Selatan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#003B73]" />
              <span>Informa Living World ALSUT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Traffic Report Light Widget */}
      <TrafficReportWidget defaultExpanded={true} />

      {/* 3. Quick Shortcuts ke Live Traffic Google Maps */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 gopay-shadow space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#003B73] text-white flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Akses Langsung Live Traffic Maps
              </h3>
              <p className="text-[11px] text-slate-500">
                Buka peta Google Maps layer kemacetan real-time per koridor utama sekitar Alam Sutera
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Klik untuk membuka Google Maps
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {directCorridors.map((corridor, idx) => (
            <button
              key={idx}
              onClick={() => openDirectTraffic(corridor.query)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-sky-50/60 hover:border-sky-300 transition-all text-left flex items-start justify-between gap-3 group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 group-hover:text-[#003B73]">
                  <span>{corridor.icon}</span>
                  <span>{corridor.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {corridor.desc}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#003B73] shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tips & SOP Komunikasi Sales Advisor Informa */}
      <div className="bg-linear-to-r from-slate-900 via-[#003B73] to-blue-900 rounded-3xl p-5 text-white gopay-shadow">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-black text-sm text-white">
              SOP Tim Sales Store: Antisipasi Kendala Traffic Jam
            </h4>
            <p className="text-xs text-sky-100/90 leading-relaxed">
              Sebagai tim sales Informa Living World Alam Sutera, kita memastikan barang customer tiba dengan aman dan dapat digunakan sebaik mungkin. Jika rute pengiriman sedang <strong>Lampu Merah / Macet Parah</strong>, kita bisa proaktif menyapa customer terlebih dahulu via WhatsApp:
            </p>
            <div className="mt-2.5 p-3 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-sky-50 leading-snug">
              &quot;Halo Kak [Nama Customer]! Salam hangat dari Tim Sales Informa Living World Alam Sutera ✨. Mau update singkat kalau saat ini armada perjalanan menuju area Kakak terpantau ada sedikit kepadatan lalu lintas di jalur [Nama Jalur]. Kita pastikan barang tetap aman &amp; sampai dengan baik ya Kak. Terima kasih banyak atas kesabarannya! 🙏&quot;
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
