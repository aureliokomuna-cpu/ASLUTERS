import Papa from 'papaparse';
import { DeliveryItem, GroupedReceipt } from '../types';
import { calculateDeliveryStatus, calculateProgress, parseDate } from './dateUtils';
import { getWhatsAppUrl, cleanPhoneNumber } from './whatsappUtils';
import { cleanCityName, CITY_CENTROIDS } from './growthUtils';

export const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2H8qksXso8KEbbj8vwtkJ1KOx-5COj-zzbHFchxMB0KkpyO1-ltWonXhtBfm-QazoQ-sRA2Rym-y3/pub?gid=0&single=true&output=csv';

/**
 * Format Indonesian mobile phone to international WhatsApp standard (628...)
 */
export function formatPhoneNumberForWa(phoneStr?: string): { cleanPhone: string; waUrl: string } {
  if (!phoneStr) return { cleanPhone: '-', waUrl: '' };
  const cleaned = cleanPhoneNumber(phoneStr);
  if (!cleaned) return { cleanPhone: phoneStr, waUrl: '' };
  return { cleanPhone: phoneStr.trim(), waUrl: `https://wa.me/${cleaned}` };
}

/**
 * Fetch and parse live CSV data from Google Sheets (Support Multi-Format DO ALSUT)
 */
export async function fetchAndParseDeliveryData(): Promise<{
  items: DeliveryItem[];
  groupedByReceipt: Map<string, GroupedReceipt>;
  cities: string[];
  lastUpdated: Date;
}> {
  const response = await fetch(CSV_URL, {
    cache: 'no-cache', // Always fetch fresh live data
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data dari Google Sheets (${response.status} ${response.statusText})`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const rawRows = results.data;
          const items: DeliveryItem[] = [];
          const citySet = new Set<string>();

          // Process rows starting from index 1 (row 0 is header)
          for (let index = 1; index < rawRows.length; index++) {
            const row = rawRows[index];
            if (!row || row.length === 0) continue;

            const col0 = (row[0] || '').trim();
            const col1 = (row[1] || '').trim();
            const col2 = (row[2] || '').trim();

            // Skip repeated header rows
            if (col0.toLowerCase().includes('company') || col1.toLowerCase().includes('receive')) {
              continue;
            }

            const val0 = parseFloat(col0);
            const val1 = parseFloat(col1);

            let lg = '';
            let lt = '';
            let companyCode = '35';
            let receiveNo = '';
            let transactionNo = '';
            let transDateRaw = '';
            let cardId = '';
            let customerName = '';
            let address = '';
            let rawCity = '';
            let phone = '';
            let shippingNotes = '';
            let deliveryScheduleRaw = '';
            let installScheduleRaw = '';
            let installerPoolId = '';
            let installNo = '';
            let isPickupAtStore = false;
            let addressNotes = '';
            let typeOrder = '';

            if (val0 > 90 && val0 < 145 && val1 < 10 && val1 > -15) {
              // Format B: Longitude & Latitude in first two columns
              lg = col0;
              lt = col1;
              companyCode = col2 || '35';
              receiveNo = (row[3] || '').trim();
              transactionNo = (row[4] || '').trim();
              transDateRaw = (row[5] || '').trim();
              cardId = (row[6] || '').trim();
              customerName = (row[7] || '').trim();
              address = (row[8] || '').trim();
              rawCity = (row[9] || '').trim();
              deliveryScheduleRaw = (row[10] || '').trim();
              shippingNotes = (row[11] || '').trim();
              phone = (row[12] || '').trim();
              installNo = (row[14] || '').trim();
              isPickupAtStore = (row[15] || '').trim() === '1';
              addressNotes = (row[16] || '').trim();
            } else if (col2.startsWith('U35.') || col2.startsWith('35.')) {
              // Format C: Surat Jalan inserted at index 2
              companyCode = col0 || '35';
              receiveNo = col1;
              transactionNo = col2;
              transDateRaw = (row[3] || '').trim();
              cardId = (row[4] || '').trim();
              customerName = (row[5] || '').trim();
              address = [row[6], row[7]].filter(Boolean).map(s => s.trim()).join(' ');
              rawCity = (row[8] || '').trim();
              phone = (row[9] || row[14] || '').trim();
              shippingNotes = (row[10] || '').trim();
              deliveryScheduleRaw = (row[11] || '').trim();
              installScheduleRaw = (row[12] || '').trim();
              installerPoolId = (row[14] || '').trim();
              lt = (row[17] || '').trim();
              lg = (row[18] && parseFloat(row[18]) > 90) ? row[18].trim() : '';
              isPickupAtStore = (row[19] || '').trim() === '1';
              addressNotes = (row[21] || '').trim();
            } else {
              // Format A (Standard)
              companyCode = col0 || '35';
              receiveNo = col1;
              transDateRaw = col2;
              cardId = (row[3] || '').trim();
              customerName = (row[4] || '').trim();
              address = [row[5], row[6]].filter(Boolean).map(s => s.trim()).join(' ');
              rawCity = (row[7] || '').trim();
              phone = (row[8] || '').trim();
              shippingNotes = (row[9] || '').trim();
              deliveryScheduleRaw = (row[10] || '').trim();
              installScheduleRaw = (row[11] || '').trim();
              installerPoolId = (row[12] || '').trim();
              lg = (row[14] || '').trim();
              lt = (row[15] || '').trim();
              installNo = (row[16] || '').trim();
              isPickupAtStore = (row[18] || '').trim() === '1';
              addressNotes = (row[19] || '').trim();
              typeOrder = (row[20] || '').trim();
            }

            // Skip empty rows
            if (!receiveNo && !customerName && !transactionNo) {
              continue;
            }

            const cityName = cleanCityName(rawCity, address);
            citySet.add(cityName);

            // Coords calculation
            let rawParsedLat = parseFloat(lt);
            let rawParsedLng = parseFloat(lg);
            let hasValidCoords = !isNaN(rawParsedLat) && !isNaN(rawParsedLng) && rawParsedLat !== 0 && rawParsedLng !== 0 && Math.abs(rawParsedLat) <= 90 && Math.abs(rawParsedLng) <= 180;

            let finalLat: number | null = hasValidCoords ? rawParsedLat : null;
            let finalLng: number | null = hasValidCoords ? rawParsedLng : null;

            // If coordinates are missing or partial, use city centroid + deterministic spatial jitter
            if (!hasValidCoords) {
              const centroid = CITY_CENTROIDS[cityName] || CITY_CENTROIDS['Tangerang'];
              const keySeed = `${receiveNo}_${customerName}_${index}`;
              let hash = 0;
              for (let i = 0; i < keySeed.length; i++) {
                hash = (hash * 31 + keySeed.charCodeAt(i)) % 100000;
              }

              if (!isNaN(rawParsedLat) && rawParsedLat !== 0 && Math.abs(rawParsedLat) <= 90) {
                // Real lat, estimate lng
                finalLat = rawParsedLat;
                const jitterLng = ((hash % 100) / 100 - 0.5) * 0.05;
                finalLng = centroid.lng + jitterLng;
                hasValidCoords = true;
              } else {
                const jitterLat = ((hash % 89) / 89 - 0.5) * 0.035;
                const jitterLng = (((hash * 17) % 97) / 97 - 0.5) * 0.045;
                finalLat = centroid.lat + jitterLat;
                finalLng = centroid.lng + jitterLng;
                hasValidCoords = true;
              }
            }

            // Parse transaction date, with fallback to Surat Jalan if date format is odd
            let transDate = parseDate(transDateRaw);
            if (!transDate && transactionNo) {
              const match = transactionNo.match(/202[4-9](\d{2})(\d{2})/);
              if (match) {
                const y = 2026;
                const m = parseInt(match[1], 10) - 1;
                const d = parseInt(match[2], 10);
                transDate = new Date(y, m, d, 0, 0, 0, 0);
                if (!transDateRaw) {
                  transDateRaw = `2026-${match[1]}-${match[2]}`;
                }
              }
            }

            const deliveryScheduleDate = parseDate(deliveryScheduleRaw);
            const installScheduleDate = parseDate(installScheduleRaw);

            const statusInfo = calculateDeliveryStatus(installScheduleDate, installScheduleRaw);
            const progress = calculateProgress(
              statusInfo.status,
              transDate,
              deliveryScheduleDate,
              installScheduleDate
            );

            const bestPhone = phone || '-';

            const item: DeliveryItem = {
              id: `${receiveNo || 'REC'}-${installNo || index}-${index}`,
              rowIndex: index,
              latitude: finalLat,
              longitude: finalLng,
              hasValidCoords,
              companyCode: companyCode || 'ALSUT',
              transactionNo: transactionNo || '',
              receiptNo: receiveNo || 'TANPA_NO_RECEIPT',
              transactionDateRaw: transDateRaw,
              transactionDate: transDate,
              memberNo: cardId || '',
              customerName: customerName || 'Customer Informa',
              address: address || 'Alamat tidak tercatat',
              cityName,
              phone,
              mobilePhone: phone,
              bestPhone,
              waLink: '',
              shippingNotes,
              addressNotes,
              deliveryScheduleRaw,
              deliveryScheduleDate,
              installScheduleRaw,
              installScheduleDate,
              installerPoolId: installerPoolId || '-',
              installNo: installNo || '-',
              isPickupAtStore,
              typeOrder,
              deliveryId: '',

              status: statusInfo.status,
              statusLabel: statusInfo.statusLabel,
              isUrgentTomorrow: statusInfo.isUrgentTomorrow,
              isToday: statusInfo.isToday,
              daysUntilInstall: statusInfo.daysUntilInstall,
              progressStep: progress.step,
              progressPercent: progress.percent,
            };

            // Set personalized Informa ALSUT Gen-Z friendly WhatsApp link
            item.waLink = getWhatsAppUrl(
              bestPhone, 
              item, 
              item.isUrgentTomorrow ? 'reminder_h1' : (item.isPickupAtStore ? 'pickup_store' : 'genz')
            );

            items.push(item);
          }

          // Group by receipt_no
          const groupedByReceipt = new Map<string, GroupedReceipt>();
          
          items.forEach((item) => {
            const key = item.receiptNo;
            if (!groupedByReceipt.has(key)) {
              groupedByReceipt.set(key, {
                receiptNo: item.receiptNo,
                customerName: item.customerName,
                memberNo: item.memberNo,
                address: item.address,
                cityName: item.cityName,
                bestPhone: item.bestPhone,
                waLink: item.waLink,
                isPickupAtStore: item.isPickupAtStore,
                items: [],
                overallStatus: item.status,
                nearestInstallDate: item.installScheduleDate,
                earliestDeliveryDate: item.deliveryScheduleDate,
                hasUrgentH1: item.isUrgentTomorrow,
                latitude: item.latitude,
                longitude: item.longitude,
                hasValidCoords: item.hasValidCoords,
              });
            }

            const group = groupedByReceipt.get(key)!;
            group.items.push(item);

            if (item.isUrgentTomorrow) {
              group.hasUrgentH1 = true;
            }
            if (item.hasValidCoords && !group.hasValidCoords) {
              group.latitude = item.latitude;
              group.longitude = item.longitude;
              group.hasValidCoords = true;
            }
            if (item.status === 'IN_TRANSIT') {
              group.overallStatus = 'IN_TRANSIT';
            } else if (item.status === 'WAITING_SCHEDULE' && group.overallStatus === 'COMPLETED') {
              group.overallStatus = 'WAITING_SCHEDULE';
            }
          });

          const sortedCities = Array.from(citySet).sort();

          resolve({
            items,
            groupedByReceipt,
            cities: sortedCities,
            lastUpdated: new Date(),
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
