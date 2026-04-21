import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  PieChart, 
  Settings, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Star,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Lock,
  Upload,
  Database,
  ShoppingCart,
  List,
  Package,
  Layers,
  ClipboardList,
  TrendingUp,
  Clock,
  Scale,
  CheckSquare,
  Square,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { Account, Voucher, AccountType, VoucherType, VoucherEntry, Item, Sale, BusinessSettings } from './types';
import Reports from './components/Reports';
import { useToast } from './components/Toast';

// --- Universal Action Bar Component ---
function ActionBar({ selectedCount, totalCount, onSelectAll, onClear, onDelete, onEdit, label }: any) {
  if (selectedCount === 0) return null;

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-2xl px-4"
    >
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-4 shadow-2xl shadow-slate-900/40 border border-white/10 flex items-center justify-between backdrop-blur-xl bg-opacity-90">
        <div className="flex items-center gap-6 ml-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-sm">
              {selectedCount}
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label} Selected</span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <button 
            onClick={onSelectAll}
            className="text-xs font-black uppercase tracking-widest hover:text-indigo-400 transition-colors"
          >
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {onEdit && selectedCount === 1 && (
            <button 
              onClick={onEdit}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              <Edit3 size={16} /> Edit
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-3 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button 
            onClick={onClear}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'sales', label: 'Sale Entry', icon: ShoppingCart },
  { id: 'sale-list', label: 'Sale List', icon: List },
  { id: 'bulk-sale', label: 'Bulk Sale', icon: Layers },
  { id: 'vouchers', label: 'Vouchers', icon: FileText },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

function Combobox({ value, onChange, options, placeholder, className, name }: { value: string, onChange: (val: string) => void, options: { label: string, value: string }[], placeholder?: string, className?: string, name?: string }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    if (selectedOption && !isOpen) {
      setQuery(selectedOption.label);
    }
  }, [value, selectedOption, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedOption) {
          setQuery(selectedOption.label);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full">
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        className={cn("w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all", className)}
        placeholder={placeholder}
        value={isOpen ? query : (selectedOption ? selectedOption.label : query)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') {
            onChange('');
          }
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filteredOptions.map(option => (
            <div
              key={option.value}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => {
                onChange(option.value);
                setQuery(option.label);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = 'cashledger_v2_data';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [seq, setSeq] = useState(0);
  const [saleSeq, setSaleSeq] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({ name: 'DigitalHisab' });
  const [isLoaded, setIsLoaded] = useState(false);
  const { showToast } = useToast();

  // Load data from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.vouchers) setVouchers(parsed.vouchers);
        if (parsed.items) setItems(parsed.items);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.pinned) setPinned(parsed.pinned);
        if (parsed.seq) setSeq(parsed.seq);
        if (parsed.saleSeq) setSaleSeq(parsed.saleSeq);
        if (parsed.businessSettings) setBusinessSettings(parsed.businessSettings);
      } catch (e) {
        console.error('Failed to parse local data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    const dataToSave = {
      accounts,
      vouchers,
      items,
      sales,
      pinned,
      seq,
      saleSeq,
      businessSettings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [accounts, vouchers, items, sales, pinned, seq, saleSeq, businessSettings, isLoaded]);

  const highlightText = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-amber-200 text-slate-900 rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  const getBalance = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return 0;
    let balance = Number(acc.openingBalance) || 0;
    const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank', 'Stock', 'Customer'].includes(acc.type);

    vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (e.accountId === accId) {
          const dr = Number(e.dr) || 0;
          const cr = Number(e.cr) || 0;
          if (isDebitNormal) {
            balance += (dr - cr);
          } else {
            balance += (cr - dr);
          }
        }
      });
    });
    return balance;
  };

  const totalCash = useMemo(() => {
    return accounts
      .filter(a => ['Cash', 'Bank'].includes(a.type))
      .reduce((sum, a) => sum + getBalance(a.id), 0);
  }, [accounts, vouchers]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard 
          totalCash={totalCash} 
          accounts={accounts} 
          vouchers={vouchers} 
          pinned={pinned} 
          getBalance={getBalance}
          setPinned={setPinned}
          setCurrentTab={setCurrentTab}
          highlightText={highlightText}
          showToast={showToast}
          businessSettings={businessSettings}
        />;
      case 'accounts':
        return <Accounts 
          accounts={accounts} 
          setAccounts={setAccounts} 
          getBalance={getBalance}
          pinned={pinned}
          setPinned={setPinned}
          highlightText={highlightText}
          showToast={showToast}
        />;
      case 'items':
        return <ItemsTab 
          items={items} 
          setItems={setItems} 
          accounts={accounts}
          showToast={showToast} 
        />;
      case 'sales':
        return <SaleEntryTab 
          accounts={accounts} 
          items={items} 
          setSales={setSales} 
          setVouchers={setVouchers}
          seq={seq}
          setSeq={setSeq}
          saleSeq={saleSeq}
          setSaleSeq={setSaleSeq}
          showToast={showToast} 
          getBalance={getBalance}
        />;
      case 'sale-list':
        return <SaleListTab 
          sales={sales} 
          setSales={setSales}
          vouchers={vouchers}
          setVouchers={setVouchers}
          accounts={accounts}
          items={items}
          showToast={showToast} 
        />;
      case 'bulk-sale':
        return <BulkSaleTab 
          accounts={accounts} 
          items={items} 
          setSales={setSales} 
          setVouchers={setVouchers}
          seq={seq}
          setSeq={setSeq}
          saleSeq={saleSeq}
          setSaleSeq={setSaleSeq}
          showToast={showToast} 
          getBalance={getBalance}
        />;
      case 'vouchers':
        return <Vouchers 
          vouchers={vouchers} 
          setVouchers={setVouchers} 
          accounts={accounts}
          seq={seq}
          setSeq={setSeq}
          highlightText={highlightText}
          showToast={showToast}
        />;
      case 'reports':
        return <Reports accounts={accounts} vouchers={vouchers} businessSettings={businessSettings} />;
      case 'settings':
        return <SettingsTab 
          setAccounts={setAccounts} 
          setVouchers={setVouchers} 
          setItems={setItems}
          setSales={setSales}
          setPinned={setPinned} 
          setSeq={setSeq}
          setSaleSeq={setSaleSeq}
          setBusinessSettings={setBusinessSettings}
          accounts={accounts}
          vouchers={vouchers}
          items={items}
          sales={sales}
          pinned={pinned}
          seq={seq}
          saleSeq={saleSeq}
          businessSettings={businessSettings}
          showToast={showToast}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <>
        {/* Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/50 transition-all duration-500 transform lg:relative lg:translate-x-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center gap-4 mb-12 px-2 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40 rotate-3 group-hover:rotate-0 transition-all duration-500">
                <Wallet size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tighter leading-none">{businessSettings.name}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mt-1.5">Offline Ledger</span>
              </div>
            </div>

            <nav className="flex-1 space-y-2.5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "nav-item w-full group",
                      isActive ? "nav-item-active" : "nav-item-inactive"
                    )}
                  >
                    <Icon size={20} className={cn(
                      "transition-all duration-500",
                      isActive ? "scale-110 rotate-0" : "group-hover:scale-110 group-hover:rotate-3"
                    )} />
                    <span className="font-bold tracking-tight text-sm">{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute right-0 w-1.5 h-6 bg-white rounded-l-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-800/50">
              <div className="px-4 py-6 bg-indigo-600/10 rounded-[2rem] border border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] text-center">DigitalHisab v2.0</p>
                <p className="text-[8px] text-slate-500 font-bold text-center mt-1">Secure Offline Storage</p>
              </div>
            </div>
          </div>
        </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="h-16 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-lg"
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-lg font-semibold text-slate-900">
                  {TABS.find(t => t.id === currentTab)?.label}
                </h1>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                {!isLoaded ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading your data...</p>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </div>
            </div>
          </main>
        </>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ totalCash, accounts, vouchers, pinned, getBalance, setPinned, setCurrentTab, highlightText, showToast, businessSettings }: any) {
  const pinnedAccs = accounts.filter((a: any) => pinned.includes(a.id));
  const recentVouchers = [...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalSales = useMemo(() => {
    return vouchers
      .filter(v => v.type === 'SALE')
      .reduce((sum, v) => sum + v.total, 0);
  }, [vouchers]);

  const totalExpense = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Expense')
      .reduce((sum: number, a: any) => sum + getBalance(a.id), 0);
  }, [accounts, vouchers, getBalance]);

  const totalReceivables = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Customer')
      .reduce((sum: number, a: any) => {
        const bal = getBalance(a.id);
        return sum + (bal > 0 ? bal : 0);
      }, 0);
  }, [accounts, vouchers, getBalance]);

  const totalPayables = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Supplier')
      .reduce((sum: number, a: any) => {
        const bal = getBalance(a.id);
        return sum + (bal < 0 ? Math.abs(bal) : 0);
      }, 0);
  }, [accounts, vouchers, getBalance]);

  const totalStockValue = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Stock')
      .reduce((sum: number, a: any) => sum + getBalance(a.id), 0);
  }, [accounts, vouchers, getBalance]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 card p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white border-none relative overflow-hidden shadow-2xl shadow-indigo-900/30 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none group-hover:scale-110 transition-transform duration-1000 delay-100"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[240px]">
            <div className="flex items-center justify-between mb-12">
              <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-xl shadow-inner border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Wallet size={32} className="text-white" />
              </div>
              <div className="flex flex-col items-end">
                <span className="px-5 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl border border-white/10">{businessSettings.name}</span>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-[10px] text-indigo-100 font-black uppercase tracking-widest">Real-time Sync</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-indigo-100/70 uppercase tracking-[0.3em] text-[10px] font-black mb-4">Total Cash & Bank</p>
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-none">
                {formatCurrency(totalCash)}
              </h1>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-8">
          <div className="card p-10 flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none relative overflow-hidden shadow-xl shadow-emerald-900/20 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-8">
                <p className="text-emerald-100/70 uppercase tracking-[0.2em] text-[10px] font-black">Customer Receivables</p>
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <ArrowUpRight size={20} className="text-white" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">{formatCurrency(totalReceivables)}</p>
            </div>
          </div>

          <div className="card p-10 flex-1 bg-gradient-to-br from-rose-500 to-pink-600 text-white border-none relative overflow-hidden shadow-xl shadow-rose-900/20 group">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-8">
                <p className="text-rose-100/70 uppercase tracking-[0.2em] text-[10px] font-black">Supplier Payables</p>
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/20 group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform">
                  <ArrowDownLeft size={20} className="text-white" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">{formatCurrency(totalPayables)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Sales</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalSales)}</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
        </div>
        <div className="card p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-rose-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Expenses</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalExpense)}</p>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={16} />
            </div>
          </div>
        </div>
        <div className="card p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stock Value</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalStockValue)}</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
              <Package size={16} />
            </div>
          </div>
        </div>
        <div className="card p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Net Profit</p>
          <div className="flex items-end justify-between">
            <p className={cn("text-2xl font-black tracking-tight", (totalSales - totalExpense) >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatCurrency(totalSales - totalExpense)}
            </p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <Activity size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <button 
          onClick={() => setCurrentTab('vouchers')}
          className="card p-10 flex flex-col items-center justify-center gap-6 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="p-6 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-[2rem] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm border border-indigo-100/50">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <span className="block font-black text-slate-900 text-xl tracking-tight">New Voucher</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 block">Record Entry</span>
          </div>
        </button>
        <button 
          onClick={() => setCurrentTab('reports')}
          className="card p-10 flex flex-col items-center justify-center gap-6 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-[2rem] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm border border-emerald-100/50">
            <PieChart size={32} />
          </div>
          <div className="text-center">
            <span className="block font-black text-slate-900 text-xl tracking-tight">View Reports</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 block">Analytics</span>
          </div>
        </button>
        <button 
          onClick={() => setCurrentTab('accounts')}
          className="card p-10 flex flex-col items-center justify-center gap-6 hover:bg-amber-50/50 hover:border-amber-200 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="p-6 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-[2rem] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-amber-100/50">
            <Users size={32} />
          </div>
          <div className="text-center">
            <span className="block font-black text-slate-900 text-xl tracking-tight">Accounts</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 block">Manage Ledger</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 flex flex-col gap-10">
          <div className="card p-8 flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shadow-sm">
                  <Star size={20} className="fill-amber-500" />
                </div>
                Pinned Accounts
              </h2>
              <button 
                onClick={() => setCurrentTab('accounts')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-all hover:bg-blue-100"
              >
                Manage
              </button>
            </div>
            
            {pinnedAccs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {pinnedAccs.map((a: any) => {
                  const bal = getBalance(a.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] transition-all hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                          {a.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 tracking-tight">{a.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{a.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("font-black tracking-tight text-lg", bal >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {formatCurrency(bal)}
                        </span>
                        <button 
                          onClick={() => {
                            setPinned((prev: string[]) => prev.filter(id => id !== a.id));
                            showToast('Account unpinned', 'info');
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white shadow-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                <div className="w-16 h-16 bg-white text-slate-300 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                  <Star size={28} />
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">No pinned accounts</p>
                <p className="text-xs text-slate-400 mb-6 max-w-[200px] mx-auto">Keep your most important ledgers right here for quick access.</p>
                <button 
                  onClick={() => setCurrentTab('accounts')}
                  className="btn btn-primary px-6 py-2.5 text-xs"
                >
                  Go to Accounts
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="card overflow-hidden flex-1 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                  <Activity size={20} />
                </div>
                Recent Vouchers
              </h2>
              <button 
                onClick={() => setCurrentTab('vouchers')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-all hover:bg-blue-100"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ref</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Type</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentVouchers.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5 text-sm text-slate-500 font-bold">{v.date}</td>
                      <td className="px-8 py-5 text-sm font-black text-slate-800 tracking-tight">{v.id}</td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                          v.type === 'CR' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          v.type === 'DR' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {v.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 text-right tabular-nums">
                        {formatCurrency(v.total)}
                      </td>
                    </tr>
                  ))}
                  {recentVouchers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                            <Activity size={28} />
                          </div>
                          <p className="text-sm font-bold text-slate-500">No recent vouchers found</p>
                          <p className="text-xs text-slate-400 mt-1">Your recent transactions will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, targetName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, targetName: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123') {
      onConfirm();
      setPassword('');
      setError('');
    } else {
      setError('Incorrect security code');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Deletion</h3>
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-0.5">Security verification required</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="p-8 bg-rose-50/50 rounded-[2rem] border border-rose-100/50">
            <p className="text-sm text-slate-600 font-bold leading-relaxed text-center">
              Are you sure you want to delete <span className="text-rose-600 font-black underline decoration-rose-300 underline-offset-4">"{targetName}"</span>? This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Security Code</label>
            <div className="relative group">
              <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={cn(
                  "input-styling pl-14 font-black tracking-[0.5em] text-center text-2xl",
                  error && "border-rose-500 ring-rose-500/10"
                )}
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 font-black text-center uppercase tracking-widest">Default code is 123</p>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn btn-outline py-4.5 rounded-2xl font-black tracking-widest text-xs">CANCEL</button>
            <button type="submit" className="flex-1 btn bg-rose-600 hover:bg-rose-700 text-white py-4.5 rounded-2xl font-black tracking-widest text-xs shadow-2xl shadow-rose-200/50">
              CONFIRM DELETE
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Accounts Component ---
function Accounts({ accounts, setAccounts, getBalance, pinned, setPinned, highlightText, showToast }: any) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [accType, setAccType] = useState<string>('Asset');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const itemsPerPage = 10;

  const accountTypes: AccountType[] = [
    'Asset', 'Liability', 'Equity', 'Expense', 'Cash', 'Bank', 'Customer', 'Supplier', 'Business', 'Loan', 'Stock'
  ];

  const filtered = accounts.filter((a: any) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as AccountType;
    const ob = Number(formData.get('ob')) || 0;

    if (!name) return;

    const newAcc: Account = {
      id: editingAcc?.id || crypto.randomUUID(),
      name,
      type,
      openingBalance: ob
    };

    if (editingAcc) {
      setAccounts((prev: Account[]) => prev.map(a => a.id === editingAcc.id ? newAcc : a));
      showToast('Account updated successfully');
    } else {
      setAccounts((prev: Account[]) => [...prev, newAcc]);
      showToast('Account created successfully');
    }
    setModalOpen(false);
    setEditingAcc(null);
  };

  const handleDelete = (id: string) => {
    setAccounts((prev: Account[]) => prev.filter(a => a.id !== id));
    setPinned((prev: string[]) => prev.filter(p => p !== id));
    showToast('Account deleted successfully', 'info');
    setDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  const confirmDeleteAccount = (acc: Account) => {
    setIsBulkDelete(false);
    setAccountToDelete(acc);
    setDeleteModalOpen(true);
  };

  const handleDeleteSelected = () => {
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    setAccounts((prev: Account[]) => prev.filter(a => !selectedIds.includes(a.id)));
    setPinned((prev: string[]) => prev.filter(p => !selectedIds.includes(p)));
    setSelectedIds([]);
    showToast(`${selectedIds.length} accounts deleted successfully`, 'info');
    setDeleteModalOpen(false);
    setIsBulkDelete(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(a => a.id));
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        <ActionBar 
          selectedCount={selectedIds.length}
          totalCount={paginated.length}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelectedIds([])}
          onDelete={handleDeleteSelected}
          onEdit={selectedIds.length === 1 ? () => {
            const acc = accounts.find((a: any) => a.id === selectedIds[0]);
            if (acc) {
              setEditingAcc(acc);
              setAccType(acc.type);
              setModalOpen(true);
            }
          } : undefined}
          label="Accounts"
        />
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              className="input-styling pl-14 font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="input-styling font-bold sm:w-48"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button 
          onClick={() => {
            setEditingAcc(null);
            setAccType('Asset');
            setModalOpen(true);
          }}
          className="btn btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200/50 flex items-center gap-3 group"
        >
          <div className="p-1.5 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span className="font-black tracking-tight">New Account</span>
        </button>
      </div>

      <div className="card overflow-hidden border-none shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-compact">
            <thead>
              <tr>
                <th className="px-6 py-6 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Account Name</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Type</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Balance</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((acc: Account) => {
                const bal = getBalance(acc.id);
                const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank', 'Customer', 'Loan'].includes(acc.type);
                const suffix = bal >= 0 ? (isDebitNormal ? 'Dr' : 'Cr') : (isDebitNormal ? 'Cr' : 'Dr');
                const isPinned = pinned.includes(acc.id);

                return (
                  <tr key={acc.id} className={cn(
                    "hover:bg-slate-50/80 transition-all duration-300 group",
                    selectedIds.includes(acc.id) && "bg-indigo-50/30"
                  )}>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => setSelectedIds(prev => prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id])}
                        className={cn(
                          "p-2 transition-colors",
                          selectedIds.includes(acc.id) ? "text-indigo-600" : "text-slate-300 hover:text-slate-400"
                        )}
                      >
                        {selectedIds.includes(acc.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-sm border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                          ['Asset', 'Cash', 'Bank', 'Customer'].includes(acc.type) ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                          acc.type === 'Expense' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          acc.type === 'Stock' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          acc.type === 'Supplier' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-slate-50 text-slate-600 border-slate-100"
                        )}>
                          <Wallet size={20} />
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-tight">
                          {highlightText(acc.name, search)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border border-slate-200/50">
                        {highlightText(acc.type, search)}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className={cn(
                        "text-base font-black tabular-nums tracking-tight",
                        bal >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {formatCurrency(bal)}
                        <span className="text-[10px] font-black opacity-40 ml-2 uppercase tracking-widest">{suffix}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 transition-all duration-300">
                        <button 
                          onClick={() => setPinned((prev: string[]) => isPinned ? prev.filter(id => id !== acc.id) : [...prev, acc.id])}
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm border",
                            isPinned ? "text-amber-500 bg-amber-50 border-amber-100" : "text-slate-500 bg-white border-slate-100 hover:bg-slate-50"
                          )}
                          title={isPinned ? "Unpin from dashboard" : "Pin to dashboard"}
                        >
                          <Star size={18} fill={isPinned ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingAcc(acc);
                            setAccType(acc.type);
                            setModalOpen(true);
                          }}
                          className="w-10 h-10 rounded-xl text-slate-500 bg-white border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center justify-center shadow-sm"
                          title="Edit account"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDeleteAccount(acc)}
                          className="w-10 h-10 rounded-xl text-slate-500 bg-white border border-slate-100 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                          title="Delete account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                        <Search size={32} />
                      </div>
                      <p className="text-base font-black text-slate-600 tracking-tight">No accounts found</p>
                      <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Try adjusting your search or create a new account to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-900">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum <= 0 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all border shadow-sm",
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white border-blue-600 shadow-blue-200" 
                          : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    {editingAcc ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingAcc ? 'Edit Account' : 'New Account'}</h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Account Name</label>
                  <input 
                    name="name"
                    defaultValue={editingAcc?.name}
                    required
                    autoFocus
                    className="input-styling"
                    placeholder="e.g. Office Rent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Account Type</label>
                  <Combobox 
                    name="type"
                    value={accType}
                    onChange={setAccType}
                    options={accountTypes.map(t => ({ label: t, value: t }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Opening Balance</label>
                  <input 
                    name="ob"
                    type="number"
                    step="0.01"
                    defaultValue={editingAcc?.openingBalance || 0}
                    className="input-styling font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 btn btn-outline py-4 rounded-2xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 btn btn-primary py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                    {editingAcc ? 'Update Account' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAccountToDelete(null);
          setIsBulkDelete(false);
        }}
        onConfirm={() => {
          if (isBulkDelete) {
            confirmBulkDelete();
          } else if (accountToDelete) {
            handleDelete(accountToDelete.id);
          }
        }}
        targetName={isBulkDelete ? `${selectedIds.length} selected accounts` : (accountToDelete?.name || 'this account')}
      />
    </div>
  );
}

// --- Vouchers Component ---
function Vouchers({ vouchers, setVouchers, accounts, seq, setSeq, highlightText, showToast }: any) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingVch, setEditingVch] = useState<Voucher | null>(null);
  const [viewingVch, setViewingVch] = useState<Voucher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const itemsPerPage = 10;

  const filtered = vouchers.filter((v: any) => 
    v.id.toLowerCase().includes(search.toLowerCase()) || 
    v.date.includes(search)
  ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string) => {
    setVouchers((prev: Voucher[]) => prev.filter(v => v.id !== id));
    showToast('Voucher deleted successfully', 'info');
    setDeleteModalOpen(false);
    setVoucherToDelete(null);
  };

  const confirmDeleteVoucher = (v: Voucher) => {
    setIsBulkDelete(false);
    setVoucherToDelete(v);
    setDeleteModalOpen(true);
  };

  const handleDeleteSelected = () => {
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    setVouchers((prev: Voucher[]) => prev.filter(v => !selectedIds.includes(v.id)));
    setSelectedIds([]);
    showToast(`${selectedIds.length} vouchers deleted successfully`, 'info');
    setDeleteModalOpen(false);
    setIsBulkDelete(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(v => v.id));
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        <ActionBar 
          selectedCount={selectedIds.length}
          totalCount={paginated.length}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelectedIds([])}
          onDelete={handleDeleteSelected}
          onEdit={selectedIds.length === 1 ? () => {
            const vch = vouchers.find((v: any) => v.id === selectedIds[0]);
            if (vch) {
              setEditingVch(vch);
              setModalOpen(true);
            }
          } : undefined}
          label="Vouchers"
        />
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search vouchers by ID or date..." 
            className="input-styling pl-14 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingVch(null);
            setModalOpen(true);
          }}
          className="btn btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200/50 flex items-center gap-3 group"
        >
          <div className="p-1.5 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span className="font-black tracking-tight">New Voucher</span>
        </button>
      </div>

      <div className="card overflow-hidden border-none shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-compact">
            <thead>
              <tr>
                <th className="px-6 py-6 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Date</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Ref</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Type</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Amount</th>
                <th className="px-6 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((v: Voucher) => (
                <tr 
                  key={v.id} 
                  className={cn(
                    "hover:bg-slate-50/80 transition-all duration-300 group cursor-pointer",
                    selectedIds.includes(v.id) && "bg-indigo-50/30"
                  )}
                  onClick={() => { setViewingVch(v); setViewModalOpen(true); }}
                >
                  <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id])}
                      className={cn(
                        "p-2 transition-colors",
                        selectedIds.includes(v.id) ? "text-indigo-600" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      {selectedIds.includes(v.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-500 font-bold">{highlightText(v.date, search)}</td>
                  <td className="px-6 py-6 text-sm font-black text-slate-900 tracking-tight">{highlightText(v.id, search)}</td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm border",
                      v.type === 'CR' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      v.type === 'DR' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-base font-black text-slate-900 text-right tabular-nums tracking-tight">
                    {formatCurrency(v.total)}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 transition-all duration-300">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingVch(v);
                          setModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl text-slate-500 bg-white border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center justify-center shadow-sm"
                        title="Edit voucher"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          confirmDeleteVoucher(v);
                        }}
                        className="w-10 h-10 rounded-xl text-slate-500 bg-white border border-slate-100 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                        title="Delete voucher"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                        <Search size={32} />
                      </div>
                      <p className="text-base font-black text-slate-600 tracking-tight">No vouchers found</p>
                      <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Try adjusting your search or create a new voucher to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-900">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum <= 0 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all border shadow-sm",
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white border-blue-600 shadow-blue-200" 
                          : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Voucher Modal */}
      <AnimatePresence>
        {viewModalOpen && viewingVch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Voucher Details</h3>
                    <p className="text-sm text-indigo-600 font-black tracking-widest uppercase mt-0.5">{viewingVch.id}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-10 overflow-y-auto space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Date</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{viewingVch.date}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Type</p>
                    <span className={cn(
                      "inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border",
                      viewingVch.type === 'CR' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      viewingVch.type === 'DR' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                      {viewingVch.type}
                    </span>
                  </div>
                </div>

                <div className="card overflow-hidden border-slate-100 shadow-xl shadow-slate-200/30">
                  <table className="w-full text-left border-collapse table-compact">
                    <thead>
                      <tr>
                        <th className="px-8 py-5">Account</th>
                        <th className="px-8 py-5">Narration</th>
                        <th className="px-8 py-5 text-right">Debit</th>
                        <th className="px-8 py-5 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {viewingVch.entries.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-sm font-black text-slate-900 tracking-tight">
                            {accounts.find((a: any) => a.id === e.accountId)?.name || 'Deleted Account'}
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500 font-bold tracking-tight">{e.narration || '-'}</td>
                          <td className="px-8 py-5 text-sm font-black text-slate-900 text-right tabular-nums tracking-tight">{e.dr > 0 ? formatCurrency(e.dr) : '0.00'}</td>
                          <td className="px-8 py-5 text-sm font-black text-slate-900 text-right tabular-nums tracking-tight">{e.cr > 0 ? formatCurrency(e.cr) : '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-black border-t border-slate-100">
                        <td colSpan={2} className="px-8 py-5 text-sm text-slate-900 uppercase tracking-[0.2em]">Total</td>
                        <td className="px-8 py-5 text-base text-slate-900 text-right tabular-nums tracking-tighter">{formatCurrency(viewingVch.total)}</td>
                        <td className="px-8 py-5 text-base text-slate-900 text-right tabular-nums tracking-tighter">{formatCurrency(viewingVch.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end gap-5 bg-slate-50/50 shrink-0">
                <button onClick={() => setViewModalOpen(false)} className="btn btn-outline px-10 py-4.5 rounded-2xl font-black tracking-widest text-xs">CLOSE</button>
                <button 
                  onClick={() => {
                    setViewModalOpen(false);
                    setEditingVch(viewingVch);
                    setModalOpen(true);
                  }}
                  className="btn btn-primary px-12 py-4.5 rounded-2xl font-black tracking-widest text-xs shadow-2xl shadow-indigo-200/50"
                >
                  EDIT VOUCHER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voucher Modal */}
      <AnimatePresence>
        {modalOpen && (
          <VoucherModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            editingVch={editingVch}
            accounts={accounts}
            setVouchers={setVouchers}
            seq={seq}
            setSeq={setSeq}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setVoucherToDelete(null);
          setIsBulkDelete(false);
        }}
        onConfirm={() => {
          if (isBulkDelete) {
            confirmBulkDelete();
          } else if (voucherToDelete) {
            handleDelete(voucherToDelete.id);
          }
        }}
        targetName={isBulkDelete ? `${selectedIds.length} selected vouchers` : (voucherToDelete ? `Voucher ${voucherToDelete.id}` : 'this voucher')}
      />
    </div>
  );
}

function VoucherModal({ isOpen, onClose, editingVch, accounts, setVouchers, seq, setSeq, showToast }: any) {
  const [date, setDate] = useState(editingVch?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<VoucherType>(editingVch?.type || 'JV');
  const [entries, setEntries] = useState<VoucherEntry[]>(editingVch?.entries || [{ accountId: '', dr: 0, cr: 0, narration: '' }]);

  const totalDr = entries.reduce((s: number, e: any) => s + (Number(e.dr) || 0), 0);
  const totalCr = entries.reduce((s: number, e: any) => s + (Number(e.cr) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

  const handleSave = () => {
    if (!isBalanced) return;

    let vch: Voucher;

    if (editingVch) {
      vch = { ...editingVch, date, type, entries, total: totalDr };
      setVouchers((prev: Voucher[]) => prev.map(v => v.id === editingVch.id ? vch : v));
      showToast('Voucher updated successfully');
    } else {
      const newSeq = seq + 1;
      setSeq(newSeq);
      const vId = 'V' + String(newSeq).padStart(4, '0');
      vch = {
        id: vId,
        date,
        type,
        entries,
        total: totalDr
      };
      setVouchers((prev: Voucher[]) => [...prev, vch]);
      showToast('Voucher created successfully');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              {editingVch ? <Edit3 size={24} /> : <Plus size={24} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingVch ? 'Edit Voucher' : 'New Voucher'}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Record a financial transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-10 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Date</label>
              <div className="relative group">
                <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-styling pl-14 font-bold"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Voucher Type</label>
              <Combobox 
                value={type}
                onChange={(val) => setType(val as VoucherType)}
                options={[
                  { label: 'Receipt (CR)', value: 'CR' },
                  { label: 'Payment (DR)', value: 'DR' },
                  { label: 'Journal (JV)', value: 'JV' }
                ]}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Transaction Lines</h4>
              <button 
                onClick={() => setEntries([...entries, { accountId: '', dr: 0, cr: 0, narration: '' }])}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-6 py-3 rounded-2xl transition-all hover:bg-indigo-100 shadow-sm"
              >
                <Plus size={16} /> Add Line
              </button>
            </div>
            
            <div className="space-y-6">
              {entries.map((entry: any, idx: number) => (
                <div key={idx} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] relative group/line hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500">
                  {entries.length > 1 && (
                    <button 
                      onClick={() => setEntries(entries.filter((_: any, i: number) => i !== idx))}
                      className="absolute -right-3 -top-3 w-10 h-10 bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center shadow-xl transition-all z-10 opacity-0 group-hover/line:opacity-100 scale-90 group-hover/line:scale-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-8">
                    <div className="sm:col-span-4 space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Account</label>
                      <Combobox 
                        value={entry.accountId}
                        onChange={(val) => {
                          const newEntries = [...entries];
                          newEntries[idx].accountId = val;
                          setEntries(newEntries);
                        }}
                        options={accounts.map((a: any) => ({ label: `${a.name} (${a.type})`, value: a.id }))}
                        placeholder="Select Account"
                        className="!bg-white !shadow-sm"
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Line Narration</label>
                      <input 
                        placeholder="Entry description..."
                        value={entry.narration}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].narration = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="input-styling !bg-white !shadow-sm font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Debit</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={entry.dr || ''}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].dr = Number(e.target.value);
                          if (newEntries[idx].dr > 0) newEntries[idx].cr = 0;
                          setEntries(newEntries);
                        }}
                        className="input-styling !bg-white !shadow-sm font-mono text-emerald-600 font-black text-lg"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Credit</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={entry.cr || ''}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].cr = Number(e.target.value);
                          if (newEntries[idx].cr > 0) newEntries[idx].dr = 0;
                          setEntries(newEntries);
                        }}
                        className="input-styling !bg-white !shadow-sm font-mono text-rose-600 font-black text-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Debit</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">{formatCurrency(totalDr)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Credit</p>
                <p className="text-2xl font-black text-rose-600 tabular-nums tracking-tight">{formatCurrency(totalCr)}</p>
              </div>
              <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[1.5rem] shadow-sm border border-slate-100">
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full shadow-sm animate-pulse",
                  isBalanced ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
                )} />
                <span className={cn(
                  "text-xs font-black uppercase tracking-[0.2em]",
                  isBalanced ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isBalanced ? 'Balanced' : 'Unbalanced'}
                </span>
              </div>
            </div>
            <div className="flex gap-5 w-full sm:w-auto">
              <button onClick={onClose} className="flex-1 sm:flex-none btn btn-outline px-10 py-5 rounded-2xl font-black tracking-widest text-xs">CANCEL</button>
              <button 
                onClick={handleSave} 
                disabled={!isBalanced}
                className="flex-1 sm:flex-none btn btn-primary px-12 py-5 rounded-2xl font-black tracking-widest text-xs shadow-2xl shadow-indigo-200/50 disabled:opacity-30"
              >
                {editingVch ? 'UPDATE VOUCHER' : 'POST VOUCHER'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Settings Component ---
function SettingsTab({ accounts, vouchers, items, sales, pinned, seq, saleSeq, businessSettings, setAccounts, setVouchers, setItems, setSales, setPinned, setSeq, setSaleSeq, setBusinessSettings, showToast }: any) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleExport = () => {
    const data = {
      accounts,
      vouchers,
      items,
      sales,
      pinned,
      seq,
      saleSeq,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digitalhisab_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.accounts && data.vouchers) {
          setAccounts(data.accounts);
          setVouchers(data.vouchers);
          setItems(data.items || []);
          setSales(data.sales || []);
          setPinned(data.pinned || []);
          setSeq(data.seq || 0);
          setSaleSeq(data.saleSeq || 0);
          showToast('Data imported successfully', 'success');
        } else {
          showToast('Invalid backup file format', 'error');
        }
      } catch (err) {
        showToast('Failed to parse backup file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearData = () => {
    setDeleteModalOpen(true);
  };

  const confirmClearData = () => {
    setAccounts([]);
    setVouchers([]);
    setItems([]);
    setSales([]);
    setPinned([]);
    setSeq(0);
    setSaleSeq(0);
    localStorage.removeItem(STORAGE_KEY);
    showToast('All data cleared', 'info');
    setDeleteModalOpen(false);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="card p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
          <Settings className="text-indigo-600" size={20} />
          Business Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
            <input 
              type="text" 
              className="input-styling font-bold" 
              value={businessSettings.name}
              onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
              placeholder="Enter Business Name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <input 
              type="text" 
              className="input-styling font-bold" 
              value={businessSettings.phone || ''}
              onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
              placeholder="e.g. +1 234 567 890"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business Address</label>
            <textarea 
              className="input-styling font-bold min-h-[100px] py-4" 
              value={businessSettings.address || ''}
              onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
              placeholder="Enter full business address"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div className="card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
            <PieChart className="text-blue-600" size={20} />
            Account Statistics
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total Accounts</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{accounts.length}</span>
            </div>
            <div className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total Vouchers</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{vouchers.length}</span>
            </div>
          </div>
        </div>

        <div className="card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
            <Activity className="text-rose-600" size={20} />
            System Status
          </h3>
          <div className="p-8 bg-rose-50/30 rounded-[2rem] border border-rose-100/50 space-y-6">
            <p className="text-sm text-slate-600 font-bold leading-relaxed">Your data is stored locally on this device. Make sure to back up your browser data regularly.</p>
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">System Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
          <Database className="text-indigo-600" size={20} />
          Data Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 group/btn"
          >
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover/btn:scale-110 transition-transform duration-500">
              <Download size={28} />
            </div>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Export Backup</span>
            <span className="text-[10px] text-slate-500 font-bold mt-2">Download JSON file</span>
          </button>

          <label className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 group/btn cursor-pointer">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover/btn:scale-110 transition-transform duration-500">
              <Upload size={28} />
            </div>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Import Backup</span>
            <span className="text-[10px] text-slate-500 font-bold mt-2">Upload JSON file</span>
          </label>

          <button 
            onClick={handleClearData}
            className="flex flex-col items-center justify-center p-8 bg-rose-50 rounded-[2rem] border border-rose-100 hover:bg-white hover:shadow-xl hover:shadow-rose-100 transition-all duration-500 group/btn"
          >
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover/btn:scale-110 transition-transform duration-500">
              <Trash2 size={28} />
            </div>
            <span className="text-sm font-black text-rose-600 uppercase tracking-widest">Clear All Data</span>
            <span className="text-[10px] text-rose-400 font-bold mt-2">Permanent action</span>
          </button>
        </div>
      </div>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmClearData}
        targetName="ALL business data (this cannot be undone)"
      />
    </div>
  );
}

// --- Items Component ---
function ItemsTab({ items, setItems, accounts, showToast }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const handleDeleteSelected = () => {
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    setItems((prev: Item[]) => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
    showToast(`${selectedIds.length} items deleted successfully`, 'info');
    setDeleteModalOpen(false);
    setIsBulkDelete(false);
  };

  const confirmDeleteItem = (item: Item) => {
    setIsBulkDelete(false);
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems((prev: Item[]) => prev.filter(i => i.id !== id));
    showToast('Item deleted successfully', 'info');
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i: any) => i.id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const rate = Number(formData.get('rate')) || 0;
    const unit = formData.get('unit') as string;
    let stockAccountId = formData.get('stockAccountId') as string;

    if (!stockAccountId) {
      const milkStock = accounts.find((a: any) => a.type === 'Stock' && a.name.toLowerCase() === 'milk');
      const firstStock = accounts.find((a: any) => a.type === 'Stock');
      stockAccountId = milkStock?.id || firstStock?.id || '';
    }

    if (!name) return;

    const newItem: Item = {
      id: editingItem?.id || crypto.randomUUID(),
      name,
      rate,
      unit,
      stockAccountId: stockAccountId || undefined
    };

    if (editingItem) {
      setItems((prev: Item[]) => prev.map(i => i.id === editingItem.id ? newItem : i));
      showToast('Item updated successfully');
    } else {
      setItems((prev: Item[]) => [...prev, newItem]);
      showToast('Item created successfully');
    }
    setModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        <ActionBar 
          selectedCount={selectedIds.length}
          totalCount={items.length}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelectedIds([])}
          onDelete={handleDeleteSelected}
          onEdit={selectedIds.length === 1 ? () => {
            const item = items.find((i: any) => i.id === selectedIds[0]);
            if (item) {
              setEditingItem(item);
              setModalOpen(true);
            }
          } : undefined}
          label="Items"
        />
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Item Management</h2>
        <button 
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          className="btn btn-primary px-8 py-3 rounded-xl shadow-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New Item
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-8 py-4 w-10">
                <button 
                  onClick={toggleSelectAll}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {selectedIds.length === items.length && items.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Item Name</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Default Rate</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Unit</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: Item) => (
              <tr key={item.id} className={cn(
                "hover:bg-slate-50 transition-colors group",
                selectedIds.includes(item.id) && "bg-indigo-50/30"
              )}>
                <td className="px-8 py-4">
                  <button 
                    onClick={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                    className={cn(
                      "p-2 transition-colors",
                      selectedIds.includes(item.id) ? "text-indigo-600" : "text-slate-300 hover:text-slate-400"
                    )}
                  >
                    {selectedIds.includes(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </td>
                <td className="px-8 py-4 font-bold text-slate-900">{item.name}</td>
                <td className="px-8 py-4 font-bold text-slate-600">{formatCurrency(item.rate)}</td>
                <td className="px-8 py-4 font-bold text-slate-600">{item.unit}</td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => confirmDeleteItem(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingItem ? 'Edit Item' : 'New Item'}</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Item Name</label>
                  <input name="name" defaultValue={editingItem?.name} required className="input-styling" placeholder="e.g. Fresh Milk" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Default Rate</label>
                    <input name="rate" type="number" step="0.01" defaultValue={editingItem?.rate} required className="input-styling" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                    <input name="unit" defaultValue={editingItem?.unit || 'Litre'} required className="input-styling" placeholder="e.g. Litre" />
                  </div>
                </div>
                <button type="submit" className="w-full btn btn-primary py-4 rounded-2xl font-black tracking-widest text-xs shadow-xl shadow-indigo-200">
                  {editingItem ? 'UPDATE ITEM' : 'CREATE ITEM'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
          setIsBulkDelete(false);
        }}
        onConfirm={() => {
          if (isBulkDelete) {
            confirmBulkDelete();
          } else if (itemToDelete) {
            handleDelete(itemToDelete.id);
          }
        }}
        targetName={isBulkDelete ? `${selectedIds.length} selected items` : (itemToDelete?.name || 'this item')}
      />
    </div>
  );
}

// --- Sale Entry Component ---
function SaleEntryTab({ accounts, items, setSales, setVouchers, seq, setSeq, saleSeq, setSaleSeq, showToast, getBalance }: any) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [rate, setRate] = useState(0);
  const [unit, setUnit] = useState('');
  const [total, setTotal] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [narration, setNarration] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');

  const selectedItem = items.find((i: Item) => i.id === itemId);

  useEffect(() => {
    if (selectedItem && !isManual) {
      setRate(selectedItem.rate);
      setUnit(selectedItem.unit);
      if (selectedItem.stockAccountId) {
        setCreditAccountId(selectedItem.stockAccountId);
      } else {
        const defaultAcc = accounts.find((a: any) => a.name.toLowerCase() === 'milk' || a.type === 'Stock');
        if (defaultAcc) setCreditAccountId(defaultAcc.id);
      }
    }
  }, [selectedItem, isManual, accounts]);

  useEffect(() => {
    if (!isManual) {
      setTotal(quantity * rate);
    }
  }, [quantity, rate, isManual]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || (!isManual && (!itemId || quantity <= 0)) || (isManual && total <= 0)) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const customer = accounts.find((a: any) => a.id === accountId);
    const item = isManual ? null : items.find((i: any) => i.id === itemId);
    
    let finalCreditAccountId = creditAccountId;
    if (!finalCreditAccountId) {
      const milkAcc = accounts.find((a: any) => a.name.toLowerCase() === 'milk' || a.type === 'Stock');
      if (milkAcc) finalCreditAccountId = milkAcc.id;
    }

    if (!finalCreditAccountId) {
      showToast('Please create a Stock account named "Milk" first', 'error');
      return;
    }

    const creditAcc = accounts.find((a: any) => a.id === finalCreditAccountId);
    if (creditAcc && creditAcc.type === 'Stock') {
      const currentStockBalance = getBalance(finalCreditAccountId);
      if (currentStockBalance < total) {
        showToast(`Insufficient stock in ${creditAcc.name}. Current balance: ${formatCurrency(currentStockBalance)}`, 'error');
        return;
      }
    }

    const newSaleSeq = saleSeq + 1;
    const newVchSeq = seq + 1;
    const saleId = `SALE-${newSaleSeq.toString().padStart(4, '0')}`;
    const vchId = `V${newVchSeq.toString().padStart(4, '0')}`;
    
    const autoNarration = narration || (isManual 
      ? `Manual Sale to ${customer.name}` 
      : `Sale of ${quantity} ${unit} ${item.name} @ ${rate} to ${customer.name}`);

    const newSale: Sale = {
      id: saleId,
      date,
      accountId,
      itemId: itemId || 'MANUAL',
      quantity: isManual ? 0 : quantity,
      rate: isManual ? 0 : rate,
      unit: isManual ? '' : unit,
      total,
      narration: autoNarration,
      voucherId: vchId
    };

    const newVoucher: Voucher = {
      id: vchId,
      date,
      type: 'SALE',
      total,
      entries: [
        { accountId: accountId, dr: total, cr: 0, narration: autoNarration }, // Debit Customer
        { accountId: finalCreditAccountId, dr: 0, cr: total, narration: autoNarration } // Credit Revenue/Stock
      ]
    };

    setSales((prev: Sale[]) => [...prev, newSale]);
    setVouchers((prev: Voucher[]) => [...prev, newVoucher]);
    setSaleSeq(newSaleSeq);
    setSeq(newVchSeq);
    
    showToast('Sale posted successfully', 'success');
    
    // Reset form
    setAccountId('');
    setItemId('');
    setQuantity(0);
    setTotal(0);
    setNarration('');
  };

  const customerOptions = accounts
    .filter((a: any) => a.type === 'Customer')
    .map((a: any) => ({ label: a.name, value: a.id }));

  const itemOptions = items.map((i: any) => ({ label: i.name, value: i.id }));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-indigo-600" size={24} />
            New Sale Entry
          </h2>
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Manual Amount</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
              />
              <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
            </div>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
              <input 
                type="date" 
                className="input-styling" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Customer</label>
              <Combobox 
                value={accountId} 
                onChange={setAccountId} 
                options={customerOptions} 
                placeholder="Select Customer" 
              />
            </div>
          </div>

          {!isManual ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Item</label>
                  <Combobox 
                    value={itemId} 
                    onChange={setItemId} 
                    options={itemOptions} 
                    placeholder="Select Item" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-styling" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                  <input 
                    type="text" 
                    className="input-styling" 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)} 
                    placeholder="e.g. Litre"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rate</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-styling" 
                    value={rate} 
                    onChange={(e) => setRate(Number(e.target.value))} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Total Amount</label>
                  <div className="input-styling bg-slate-50 font-black text-indigo-600 flex items-center">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Total Amount (Manual)</label>
              <input 
                type="number" 
                step="0.01"
                className="input-styling font-black text-indigo-600" 
                value={total} 
                onChange={(e) => setTotal(Number(e.target.value))} 
                required 
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Narration (Optional)</label>
            <textarea 
              className="input-styling min-h-[100px] py-4" 
              value={narration} 
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Auto-generated if left blank..."
            />
          </div>

          <button type="submit" className="w-full btn btn-primary py-5 rounded-2xl font-black tracking-widest text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3">
            <TrendingUp size={20} />
            POST SALE VOUCHER
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Sale List Component ---
function SaleListTab({ sales, setSales, vouchers, setVouchers, accounts, items, showToast }: any) {
  const [search, setSearch] = useState('');
  const [viewingVch, setViewingVch] = useState<Voucher | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const filtered = sales.filter((s: Sale) => {
    const customer = accounts.find((a: any) => a.id === s.accountId);
    const item = items.find((i: any) => i.id === s.itemId);
    return (
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      item?.name.toLowerCase().includes(search.toLowerCase())
    );
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const confirmDeleteSale = (sale: Sale) => {
    setIsBulkDelete(false);
    setSaleToDelete(sale);
    setDeleteModalOpen(true);
  };

  const handleDelete = (sale: Sale) => {
    setSales((prev: Sale[]) => prev.filter(s => s.id !== sale.id));
    setVouchers((prev: Voucher[]) => prev.filter(v => v.id !== sale.voucherId));
    showToast('Sale deleted successfully', 'info');
    setDeleteModalOpen(false);
    setSaleToDelete(null);
  };

  const handleDeleteSelected = () => {
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const selectedSales = sales.filter((s: any) => selectedIds.includes(s.id));
    const voucherIdsToDelete = selectedSales.map((s: any) => s.voucherId);
    
    setSales((prev: Sale[]) => prev.filter(s => !selectedIds.includes(s.id)));
    setVouchers((prev: Voucher[]) => prev.filter(v => !voucherIdsToDelete.includes(v.id)));
    setSelectedIds([]);
    showToast(`${selectedIds.length} sales deleted successfully`, 'info');
    setDeleteModalOpen(false);
    setIsBulkDelete(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((s: any) => s.id));
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        <ActionBar 
          selectedCount={selectedIds.length}
          totalCount={filtered.length}
          onSelectAll={toggleSelectAll}
          onClear={() => setSelectedIds([])}
          onDelete={handleDeleteSelected}
          onEdit={selectedIds.length === 1 ? () => {
            const sale = sales.find((s: any) => s.id === selectedIds[0]);
            if (sale) {
              const vch = vouchers.find((v: any) => v.id === sale.voucherId);
              if (vch) {
                setViewingVch(vch);
              }
            }
          } : undefined}
          label="Sales"
        />
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search sales by ID, customer or item..." 
            className="input-styling pl-14 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-8 py-4 w-10">
                <button 
                  onClick={toggleSelectAll}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Sale ID</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Item</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Qty</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((sale: Sale) => {
              const customer = accounts.find((a: any) => a.id === sale.accountId);
              const item = items.find((i: any) => i.id === sale.itemId);
              return (
                <tr key={sale.id} className={cn(
                  "hover:bg-slate-50 transition-colors group",
                  selectedIds.includes(sale.id) && "bg-indigo-50/30"
                )}>
                  <td className="px-8 py-4">
                    <button 
                      onClick={() => setSelectedIds(prev => prev.includes(sale.id) ? prev.filter(id => id !== sale.id) : [...prev, sale.id])}
                      className={cn(
                        "p-2 transition-colors",
                        selectedIds.includes(sale.id) ? "text-indigo-600" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      {selectedIds.includes(sale.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-8 py-4 font-bold text-slate-600">{sale.date}</td>
                  <td className="px-8 py-4 font-black text-indigo-600">{sale.id}</td>
                  <td className="px-8 py-4 font-bold text-slate-900">{customer?.name}</td>
                  <td className="px-8 py-4 font-bold text-slate-600">{item?.name}</td>
                  <td className="px-8 py-4 font-bold text-slate-600">{sale.quantity} {sale.unit}</td>
                  <td className="px-8 py-4 font-black text-slate-900 text-right">{formatCurrency(sale.total)}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          const vch = vouchers.find((v: any) => v.id === sale.voucherId);
                          if (vch) setViewingVch(vch);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Invoice"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => confirmDeleteSale(sale)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Sale"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {viewingVch && (
          <VoucherModal 
            isOpen={true} 
            onClose={() => setViewingVch(null)} 
            editingVch={viewingVch}
            accounts={accounts}
            setVouchers={setVouchers}
            seq={0}
            setSeq={() => {}}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSaleToDelete(null);
          setIsBulkDelete(false);
        }}
        onConfirm={() => {
          if (isBulkDelete) {
            confirmBulkDelete();
          } else if (saleToDelete) {
            handleDelete(saleToDelete);
          }
        }}
        targetName={isBulkDelete ? `${selectedIds.length} selected sales` : (saleToDelete ? `Sale ${saleToDelete.id}` : 'this sale')}
      />
    </div>
  );
}

// --- Bulk Sale Component ---
function BulkSaleTab({ accounts, items, setSales, setVouchers, seq, setSeq, saleSeq, setSaleSeq, showToast, getBalance }: any) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemId, setItemId] = useState('');
  const [bulkEntries, setBulkEntries] = useState<any[]>([]);

  const customers = accounts.filter((a: any) => a.type === 'Customer');
  const selectedItem = items.find((i: Item) => i.id === itemId);

  useEffect(() => {
    if (customers.length > 0) {
      setBulkEntries(customers.map((c: any) => ({
        accountId: c.id,
        quantity: 0,
        rate: selectedItem?.rate || 0,
        unit: selectedItem?.unit || '',
        total: 0,
        selected: true
      })));
    }
  }, [customers.length, itemId]);

  const toggleAll = () => {
    const allSelected = bulkEntries.every(e => e.selected);
    setBulkEntries(prev => prev.map(e => ({ ...e, selected: !allSelected })));
  };

  const handleEntryChange = (index: number, field: string, value: any) => {
    const newEntries = [...bulkEntries];
    newEntries[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      newEntries[index].total = newEntries[index].quantity * newEntries[index].rate;
    }
    setBulkEntries(newEntries);
  };

  const handleSubmit = () => {
    const validEntries = bulkEntries.filter(e => e.selected && e.total > 0);
    if (validEntries.length === 0) {
      showToast('No valid selected entries to post', 'error');
      return;
    }

    const item = items.find((i: any) => i.id === itemId);
    const milkStock = accounts.find((a: any) => a.name.toLowerCase() === 'milk' || a.type === 'Stock');
    
    const creditAccId = item?.stockAccountId || milkStock?.id;

    if (!creditAccId) {
      showToast('Please create a Stock account named "Milk" first', 'error');
      return;
    }

    const totalRequired = validEntries.reduce((sum, e) => sum + e.total, 0);
    const creditAcc = accounts.find((a: any) => a.id === creditAccId);
    if (creditAcc && creditAcc.type === 'Stock') {
      const currentStockBalance = getBalance(creditAccId);
      if (currentStockBalance < totalRequired) {
        showToast(`Insufficient stock in ${creditAcc.name}. Total required: ${formatCurrency(totalRequired)}, Available: ${formatCurrency(currentStockBalance)}`, 'error');
        return;
      }
    }

    let currentSaleSeq = saleSeq;
    let currentVchSeq = seq;
    const newSales: Sale[] = [];
    const newVouchers: Voucher[] = [];

    validEntries.forEach(entry => {
      currentSaleSeq++;
      currentVchSeq++;
      const saleId = `SALE-${currentSaleSeq.toString().padStart(4, '0')}`;
      const vchId = `V${currentVchSeq.toString().padStart(4, '0')}`;
      const customer = accounts.find((a: any) => a.id === entry.accountId);
      const item = items.find((i: any) => i.id === itemId);
      
      const narration = entry.quantity > 0 
        ? `Sale of ${entry.quantity} ${entry.unit} ${item?.name || 'Manual'} @ ${entry.rate} to ${customer.name}`
        : `Manual Sale to ${customer.name}`;

      newSales.push({
        id: saleId,
        date,
        accountId: entry.accountId,
        itemId: itemId || 'MANUAL',
        quantity: entry.quantity,
        rate: entry.rate,
        unit: entry.unit,
        total: entry.total,
        narration,
        voucherId: vchId
      });

      newVouchers.push({
        id: vchId,
        date,
        type: 'SALE',
        total: entry.total,
        entries: [
          { accountId: entry.accountId, dr: entry.total, cr: 0, narration },
          { accountId: creditAccId, dr: 0, cr: entry.total, narration }
        ]
      });
    });

    setSales((prev: Sale[]) => [...prev, ...newSales]);
    setVouchers((prev: Voucher[]) => [...prev, ...newVouchers]);
    setSaleSeq(currentSaleSeq);
    setSeq(currentVchSeq);
    showToast(`Posted ${validEntries.length} sales successfully`, 'success');
  };

  return (
    <div className="space-y-8">
      <div className="card p-10">
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
            <input type="date" className="input-styling" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Item (Optional for Manual)</label>
            <Combobox 
              value={itemId} 
              onChange={setItemId} 
              options={items.map((i: any) => ({ label: i.name, value: i.id }))} 
              placeholder="Select Item" 
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-10 py-4 w-10">
                  <button 
                    onClick={toggleAll}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {bulkEntries.length > 0 && bulkEntries.every(e => e.selected) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Unit</th>
                <th className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rate</th>
                <th className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bulkEntries.map((entry, idx) => {
                const customer = accounts.find((a: any) => a.id === entry.accountId);
                return (
                  <tr key={entry.accountId} className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    !entry.selected && "opacity-50 grayscale-[0.5]"
                  )}>
                    <td className="px-10 py-4">
                      <button 
                        onClick={() => handleEntryChange(idx, 'selected', !entry.selected)}
                        className={cn(
                          "p-2 transition-colors",
                          entry.selected ? "text-indigo-600" : "text-slate-300 hover:text-slate-400"
                        )}
                      >
                        {entry.selected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-10 py-4 font-bold text-slate-900">{customer?.name}</td>
                    <td className="px-10 py-4">
                      <input 
                        type="number" 
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 font-bold"
                        value={entry.quantity}
                        onChange={(e) => handleEntryChange(idx, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-10 py-4">
                      <input 
                        type="text" 
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 font-bold"
                        value={entry.unit}
                        onChange={(e) => handleEntryChange(idx, 'unit', e.target.value)}
                      />
                    </td>
                    <td className="px-10 py-4">
                      <input 
                        type="number" 
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 font-bold"
                        value={entry.rate}
                        onChange={(e) => handleEntryChange(idx, 'rate', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-10 py-4 text-right">
                      <input 
                        type="number" 
                        className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 font-black text-indigo-600 text-right"
                        value={entry.total}
                        onChange={(e) => handleEntryChange(idx, 'total', Number(e.target.value))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSubmit}
            className="btn btn-primary px-12 py-4 rounded-2xl font-black tracking-widest text-sm shadow-xl shadow-indigo-200 flex items-center gap-3"
          >
            <ClipboardList size={20} />
            POST BULK SALES
          </button>
        </div>
      </div>
    </div>
  );
}
