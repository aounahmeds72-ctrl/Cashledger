export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense' | 'Cash' | 'Bank';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
}

export interface VoucherEntry {
  accountId: string;
  dr: number;
  cr: number;
  narration?: string;
}

export type VoucherType = 'CR' | 'DR' | 'JV';

export interface Voucher {
  id: string;
  date: string;
  type: VoucherType;
  entries: VoucherEntry[];
  total: number;
  narration?: string;
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
