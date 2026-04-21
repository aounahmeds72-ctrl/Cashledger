export type AccountType = 
  | 'Asset' 
  | 'Liability' 
  | 'Equity' 
  | 'Expense' 
  | 'Cash' 
  | 'Bank'
  | 'Customer'
  | 'Supplier'
  | 'Business'
  | 'Loan'
  | 'Stock';

export interface BusinessSettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
}

export interface Item {
  id: string;
  name: string;
  rate: number;
  unit: string;
  stockAccountId?: string;
}

export interface Sale {
  id: string;
  date: string;
  accountId: string;
  itemId: string;
  quantity: number;
  rate: number;
  unit: string;
  total: number;
  narration: string;
  voucherId: string; // Reference to the generated voucher
}

export interface VoucherEntry {
  accountId: string;
  dr: number;
  cr: number;
  narration?: string;
}

export type VoucherType = 'CR' | 'DR' | 'JV' | 'SALE';

export interface Voucher {
  id: string;
  date: string;
  type: VoucherType;
  entries: VoucherEntry[];
  total: number;
}

export interface ReportTransaction {
  date: string;
  vId: string;
  narration: string;
  dr: number;
  cr: number;
  currentBalance: number;
}

export interface ReportData {
  account: Account;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  transactions: ReportTransaction[];
  isDebitNormal: boolean;
}
