export type TrafficStatusLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface CorridorTrafficInfo {
  id: string;
  name: string;
  area: 'TANGSEL' | 'TANGERANG_KOTA' | 'TOL_ALSUT' | 'JABODETABEK';
  areaLabel: string;
  status: TrafficStatusLevel;
  speedKmh: number;
  condition: string;
  notes: string;
  peakHourImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdatedTime: string;
}

export interface JabodetabekTrafficSummary {
  overallStatus: TrafficStatusLevel;
  statusTitle: string;
  statusSubtitle: string;
  peakHourStatus: 'MORNING_PEAK' | 'MIDDAY_NORMAL' | 'EVENING_PEAK' | 'NIGHT_SMOOTH';
  peakHourLabel: string;
  weatherCondition: string;
  weatherImpact: string;
  corridors: CorridorTrafficInfo[];
}
