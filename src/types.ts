export type DeliveryStatus = 
  | 'WAITING_SCHEDULE' // 1/1/1900 or empty
  | 'IN_TRANSIT'       // >= today
  | 'COMPLETED';       // < today and not 1900

export type ProgressStep = 
  | 'ORDER_RECEIVED'   // Order Diterima
  | 'PREPARING'        // Barang Disiapkan
  | 'ON_DELIVERY'      // Dalam Perjalanan
  | 'ARRIVED'          // Tiba di Lokasi
  | 'INSTALLED';       // Instalasi Selesai

export interface RawCsvRow {
  lg?: string;
  lt?: string;
  company_code?: string;
  notrans?: string;
  receive_no?: string;
  transdate?: string;
  card_id?: string;
  cust_name?: string;
  cust_address1?: string;
  cust_address2?: string;
  'TANGGAL TRANSAKSI'?: string;
  'NO MEMBER'?: string;
  'NAMA CUSTOMER'?: string;
  cust_address?: string;
  city_name?: string;
  cust_phone?: string;
  cust_fax?: string;
  request_date?: string;
  realisasi_tgl_install?: string;
  JADWAL_PENGIRIMAN?: string;
  JADWAL_INSTALASI?: string;
  cust_hp?: string;
  installer_pool_id?: string;
  install_no?: string;
  booking_indent?: string;
  CUSTOMER_PICKUPATSTORE?: string;
  ADDRESS_NOTE?: string;
  type_order?: string;
  delivery_id?: string;
  [key: string]: string | undefined;
}

export type { AreaGrowthStat, MonthlyComparison } from './utils/growthUtils';

export interface DeliveryItem {
  id: string;
  rowIndex: number;
  latitude: number | null;
  longitude: number | null;
  hasValidCoords: boolean;
  companyCode: string;
  transactionNo: string;
  receiptNo: string;
  transactionDateRaw: string;
  transactionDate: Date | null;
  memberNo: string;
  customerName: string;
  address: string;
  cityName: string;
  phone: string;
  mobilePhone: string;
  bestPhone: string;
  waLink: string;
  shippingNotes: string; // From cust_fax
  addressNotes: string;  // From ADDRESS_NOTE
  deliveryScheduleRaw: string;
  deliveryScheduleDate: Date | null;
  installScheduleRaw: string;
  installScheduleDate: Date | null;
  installerPoolId: string;
  installNo: string;
  isPickupAtStore: boolean;
  typeOrder: string;
  deliveryId: string;
  
  // Computed properties
  datasetYear?: 2025 | 2026;
  status: DeliveryStatus;
  statusLabel: string;
  isUrgentTomorrow: boolean; // H-1
  isToday: boolean;
  daysUntilInstall: number | null;
  progressStep: ProgressStep;
  progressPercent: number; // 0 - 100
}

export interface GroupedReceipt {
  receiptNo: string;
  customerName: string;
  memberNo: string;
  address: string;
  cityName: string;
  bestPhone: string;
  waLink: string;
  isPickupAtStore: boolean;
  items: DeliveryItem[];
  overallStatus: DeliveryStatus;
  nearestInstallDate: Date | null;
  earliestDeliveryDate: Date | null;
  hasUrgentH1: boolean;
  latitude: number | null;
  longitude: number | null;
  hasValidCoords: boolean;
}

export interface FilterOptions {
  searchQuery: string;
  city: string;
  statusFilter: 'ALL' | 'H1_ONLY' | 'TODAY_ONLY' | 'EXPEDITION_ONLY' | 'REGULAR';
  sortBy: 'NEAREST_DATE' | 'FURTHEST_DATE' | 'CUSTOMER_NAME' | 'RECEIPT_NO';
  pickupFilter: 'ALL' | 'DELIVERY_ONLY' | 'PICKUP_ONLY';
}
