import firebase from 'firebase/compat/app';

export interface DashboardMetrics {
  annualGoal: number;
  currentRevenue: number;
  previousYearRevenue: number;
  updatedAt?: firebase.firestore.Timestamp | Date;
  updatedBy?: string;
}

export type PortalIndicatorType = 'essencial' | 'complementar';
export type PortalIndicatorUnit = 'percentual' | 'moeda' | 'numero';

export interface PortalBjIndicator {
  id?: string;
  name: string;
  type: PortalIndicatorType;
  achieved: number;
  goal: number;
  unit: PortalIndicatorUnit;
  order: number;
  year: number;
  updatedAt?: firebase.firestore.Timestamp | Date;
  updatedBy?: string;
}