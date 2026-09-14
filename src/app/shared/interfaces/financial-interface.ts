import firebase from 'firebase/compat/app';

export type FinancialEntryType = 'entrada' | 'saida';

export interface FinancialEntry {
  id?: string;
  amount: number;
  attachment?: string | null;
  category: string;
  date: firebase.firestore.Timestamp | Date;
  supplier: string;
  title: string;
  type: FinancialEntryType;
}