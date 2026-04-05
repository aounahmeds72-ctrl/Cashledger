import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { Account, Voucher, AccountType, VoucherType, VoucherEntry } from './types';
import Reports from './components/Reports';
import { useToast } from './components/Toast';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import { LogOut, User } from 'lucide-react';

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
  { id: 'vouchers', label: 'Vouchers', icon: FileText },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const STORAGE_KEY = 'cashledger_v2_data';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [seq, setSeq] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  // Handle Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        // Clear local state on sign out
        setAccounts([]);
        setVouchers([]);
        setPinned([]);
        setSeq(0);
        setIsLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Load data from Supabase
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Accounts
        const { data: accs, error: accError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('name');
        
        if (accError) throw accError;

        // 2. Fetch Vouchers with Entries
        const { data: vchs, error: vchError } = await supabase
          .from('vouchers')
          .select(`
            *,
            voucher_entries (*)
          `)
          .eq('user_id', session.user.id)
          .order('date', { ascending: false });

        if (vchError) throw vchError;

        // 3. Fetch Settings
        const { data: settings, error: setError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', session.user.id);

        if (setError) throw setError;

        // Map data to local state
        if (accs) {
          setAccounts(accs.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type as AccountType,
            openingBalance: Number(a.opening_balance)
          })));
        }

        if (vchs) {
          setVouchers(vchs.map(v => ({
            id: v.id,
            date: v.date,
            type: v.type as VoucherType,
            total: Number(v.total),
            narration: v.narration,
            entries: v.voucher_entries.map((e: any) => ({
              accountId: e.account_id,
              dr: Number(e.dr),
              cr: Number(e.cr),
              narration: e.narration
            }))
          })));
        }

        const pinnedSetting = settings?.find(s => s.key === 'pinned');
        const seqSetting = settings?.find(s => s.key === 'seq');

        if (pinnedSetting) setPinned(pinnedSetting.value || []);
        if (seqSetting) setSeq(seqSetting.value || 0);

      } catch (e) {
        console.error('Failed to load data from Supabase', e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [session]);

  // Sync settings to Supabase
  useEffect(() => {
    if (!isLoaded || !session?.user?.id) return;

    const syncData = async () => {
      setIsSyncing(true);
      try {
        await supabase.from('settings').upsert([
          { key: 'pinned', user_id: session.user.id, value: pinned },
          { key: 'seq', user_id: session.user.id, value: seq }
        ]);
      } catch (e) {
        console.error('Sync failed', e);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeout = setTimeout(syncData, 1000);
    return () => clearTimeout(timeout);
  }, [pinned, seq, isLoaded, session]);

  // Helper functions for Supabase updates
  const updateAccount = async (acc: Account) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('accounts').upsert({
      id: acc.id,
      user_id: session.user.id,
      name: acc.name,
      type: acc.type,
      opening_balance: acc.openingBalance
    });
    if (error) {
      console.error('Failed to update account', error);
      showToast('Failed to sync account', 'error');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Failed to delete account', error);
      showToast('Failed to delete account from server', 'error');
    }
  };

  const updateVoucher = async (vch: Voucher) => {
    if (!session?.user?.id) return;
    // 1. Upsert Voucher
    const { error: vchError } = await supabase.from('vouchers').upsert({
      id: vch.id,
      user_id: session.user.id,
      date: vch.date,
      type: vch.type,
      total: vch.total,
      narration: vch.narration
    });

    if (vchError) {
      console.error('Failed to update voucher', vchError);
      showToast('Failed to sync voucher', 'error');
      return;
    }

    // 2. Delete old entries and insert new ones
    await supabase.from('voucher_entries').delete().eq('voucher_id', vch.id).eq('user_id', session.user.id);
    const { error: entError } = await supabase.from('voucher_entries').insert(
      vch.entries.map(e => ({
        voucher_id: vch.id,
        user_id: session.user.id,
        account_id: e.accountId,
        dr: e.dr,
        cr: e.cr,
        narration: e.narration
      }))
    );

    if (entError) {
      console.error('Failed to update voucher entries', entError);
      showToast('Failed to sync voucher entries', 'error');
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Failed to delete voucher', error);
      showToast('Failed to delete voucher from server', 'error');
    }
  };

  const getBalance = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return 0;
    let balance = Number(acc.openingBalance) || 0;
    const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank'].includes(acc.type);

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
          updateAccount={updateAccount}
          deleteAccount={deleteAccount}
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
          updateVoucher={updateVoucher}
          deleteVoucher={deleteVoucher}
        />;
      case 'reports':
        return <Reports accounts={accounts} vouchers={vouchers} />;
      case 'settings':
        return <SettingsTab 
          setAccounts={setAccounts} 
          setVouchers={setVouchers} 
          setPinned={setPinned} 
          setSeq={setSeq}
          accounts={accounts}
          vouchers={vouchers}
          pinned={pinned}
          seq={seq}
          showToast={showToast}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {!session ? (
        <Auth />
      ) : (
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
            "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                  <Wallet size={24} />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">CashLedger</span>
              </div>

              <nav className="flex-1 space-y-1">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCurrentTab(tab.id);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        currentTab === tab.id 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                          : "hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon size={20} className={cn(
                        "transition-colors",
                        currentTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-white"
                      )} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{session.user.email}</p>
                    <p className="text-[10px] text-slate-500 truncate">Standard User</p>
                  </div>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
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
                {renderTabContent()}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ totalCash, accounts, vouchers, pinned, getBalance, setPinned, setCurrentTab, highlightText, showToast }: any) {
  const pinnedAccs = accounts.filter((a: any) => pinned.includes(a.id));
  const recentVouchers = [...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalIncome = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Income')
      .reduce((sum: number, a: any) => sum + getBalance(a.id), 0);
  }, [accounts, vouchers]);

  const totalExpense = useMemo(() => {
    return accounts
      .filter((a: any) => a.type === 'Expense')
      .reduce((sum: number, a: any) => sum + getBalance(a.id), 0);
  }, [accounts, vouchers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <ArrowUpRight size={16} className="text-slate-300" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cash & Bank Balance</p>
          <p className={cn("text-2xl font-bold", totalCash >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {formatCurrency(totalCash)}
          </p>
        </div>
        
        <div className="card p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="card p-6 border-l-4 border-l-rose-500 bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-rose-600">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setCurrentTab('vouchers')}
              className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold">New Voucher</span>
            </button>
            <button 
              onClick={() => setCurrentTab('reports')}
              className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <PieChart size={20} />
              </div>
              <span className="text-xs font-bold">View Reports</span>
            </button>
            <button 
              onClick={() => setCurrentTab('accounts')}
              className="flex items-center gap-4 p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <span className="text-xs font-bold">Manage Accounts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              Pinned Accounts
            </h2>
            <button 
              onClick={() => setCurrentTab('accounts')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Manage
            </button>
          </div>
          
          {pinnedAccs.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {pinnedAccs.map((a: any) => {
                const bal = getBalance(a.id);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all hover:border-blue-200 hover:bg-blue-50/30 group">
                    <span className="font-medium text-slate-700">{a.name}</span>
                    <span className={cn("font-bold", bal >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {formatCurrency(bal)}
                    </span>
                    <button 
                      onClick={() => {
                        setPinned((prev: string[]) => prev.filter(id => id !== a.id));
                        showToast('Account unpinned', 'info');
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-sm text-slate-400">No accounts pinned yet.</p>
              <button 
                onClick={() => setCurrentTab('accounts')}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline"
              >
                Go to Accounts
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent Vouchers</h2>
          <button 
            onClick={() => setCurrentTab('vouchers')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentVouchers.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{v.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{v.id}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      v.type === 'CR' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      v.type === 'DR' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                      "bg-blue-50 text-blue-700 border border-blue-100"
                    )}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                    {formatCurrency(v.total)}
                  </td>
                </tr>
              ))}
              {recentVouchers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    No recent vouchers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Accounts Component ---
function Accounts({ accounts, setAccounts, getBalance, pinned, setPinned, highlightText, showToast, updateAccount, deleteAccount }: any) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = accounts.filter((a: any) => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.type.toLowerCase().includes(search.toLowerCase())
  );

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
    updateAccount(newAcc);
    setModalOpen(false);
    setEditingAcc(null);
  };

  const handleDelete = (id: string) => {
    // Removed confirm() for iframe compatibility
    setAccounts((prev: Account[]) => prev.filter(a => a.id !== id));
    setPinned((prev: string[]) => prev.filter(p => p !== id));
    deleteAccount(id);
    showToast('Account deleted successfully', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingAcc(null);
            setModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Account
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Balance</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((acc: Account) => {
                const bal = getBalance(acc.id);
                const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank'].includes(acc.type);
                const suffix = bal >= 0 ? (isDebitNormal ? 'Dr' : 'Cr') : (isDebitNormal ? 'Cr' : 'Dr');
                const isPinned = pinned.includes(acc.id);

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {highlightText(acc.name, search)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {highlightText(acc.type, search)}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-sm font-bold text-right",
                      bal >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {formatCurrency(bal)} <span className="text-[10px] font-normal text-slate-400 ml-1">{suffix}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setPinned((prev: string[]) => isPinned ? prev.filter(id => id !== acc.id) : [...prev, acc.id])}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isPinned ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-100"
                          )}
                        >
                          <Star size={16} fill={isPinned ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingAcc(acc);
                            setModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(acc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold">{filtered.length}</span> accounts
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
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
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                          : "text-slate-600 hover:bg-slate-100"
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
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{editingAcc ? 'Edit Account' : 'New Account'}</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Name</label>
                  <input 
                    name="name"
                    defaultValue={editingAcc?.name}
                    required
                    autoFocus
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. Office Rent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Type</label>
                  <select 
                    name="type"
                    defaultValue={editingAcc?.type || 'Asset'}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {['Asset', 'Liability', 'Equity', 'Income', 'Expense', 'Cash', 'Bank'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Opening Balance</label>
                  <input 
                    name="ob"
                    type="number"
                    step="0.01"
                    defaultValue={editingAcc?.openingBalance || 0}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1">Save Account</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Vouchers Component ---
function Vouchers({ vouchers, setVouchers, accounts, seq, setSeq, highlightText, showToast, updateVoucher, deleteVoucher }: any) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingVch, setEditingVch] = useState<Voucher | null>(null);
  const [viewingVch, setViewingVch] = useState<Voucher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = vouchers.filter((v: any) => 
    v.id.toLowerCase().includes(search.toLowerCase()) || 
    v.date.includes(search)
  ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string) => {
    // Removed confirm() as it may not work in iframes
    setVouchers((prev: Voucher[]) => prev.filter(v => v.id !== id));
    deleteVoucher(id);
    showToast('Voucher deleted successfully', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search vouchers..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingVch(null);
            setModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Voucher
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((v: Voucher) => (
                <tr 
                  key={v.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm text-slate-600 cursor-pointer" onClick={() => { setViewingVch(v); setViewModalOpen(true); }}>{highlightText(v.date, search)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 cursor-pointer" onClick={() => { setViewingVch(v); setViewModalOpen(true); }}>{highlightText(v.id, search)}</td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => { setViewingVch(v); setViewModalOpen(true); }}>
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      v.type === 'CR' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      v.type === 'DR' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                      "bg-blue-50 text-blue-700 border border-blue-100"
                    )}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right cursor-pointer" onClick={() => { setViewingVch(v); setViewModalOpen(true); }}>
                    {formatCurrency(v.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingVch(v);
                          setModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(v.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold">{filtered.length}</span> vouchers
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
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
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                          : "text-slate-600 hover:bg-slate-100"
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
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Voucher Details: {viewingVch.id}</h3>
                <button onClick={() => setViewModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-medium text-slate-900">{viewingVch.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</p>
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      viewingVch.type === 'CR' ? "bg-emerald-50 text-emerald-700" :
                      viewingVch.type === 'DR' ? "bg-rose-50 text-rose-700" :
                      "bg-blue-50 text-blue-700"
                    )}>
                      {viewingVch.type}
                    </span>
                  </div>
                </div>

                {viewingVch.narration && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">General Narration</p>
                    <p className="text-sm text-slate-600">{viewingVch.narration}</p>
                  </div>
                )}

                <div className="table-container">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Narration</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Debit</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingVch.entries.map((e, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {accounts.find((a: any) => a.id === e.accountId)?.name || 'Deleted Account'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{e.narration || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900 text-right">{e.dr > 0 ? formatCurrency(e.dr) : '0.00'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900 text-right">{e.cr > 0 ? formatCurrency(e.cr) : '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/50 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-sm text-slate-900">Total</td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(viewingVch.total)}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(viewingVch.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setViewModalOpen(false)} className="btn btn-outline">Close</button>
                <button 
                  onClick={() => {
                    setViewModalOpen(false);
                    setEditingVch(viewingVch);
                    setModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  Edit Voucher
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
            updateVoucher={updateVoucher}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VoucherModal({ isOpen, onClose, editingVch, accounts, setVouchers, seq, setSeq, showToast, updateVoucher }: any) {
  const [date, setDate] = useState(editingVch?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<VoucherType>(editingVch?.type || 'JV');
  const [entries, setEntries] = useState<VoucherEntry[]>(editingVch?.entries || [{ accountId: '', dr: 0, cr: 0, narration: '' }]);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [accSearch, setAccSearch] = useState('');

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
    updateVoucher(vch);
    onClose();
  };

  const filteredAccounts = accounts.filter((a: any) => 
    a.name.toLowerCase().includes(accSearch.toLowerCase()) || 
    a.type.toLowerCase().includes(accSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-slate-900">{editingVch ? 'Edit Voucher' : 'New Voucher'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Voucher Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as VoucherType)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="CR">Receipt (CR)</option>
                <option value="DR">Payment (DR)</option>
                <option value="JV">Journal (JV)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entries</h4>
              <button 
                onClick={() => setEntries([...entries, { accountId: '', dr: 0, cr: 0, narration: '' }])}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>
            
            <div className="space-y-3">
              {entries.map((entry: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                  {entries.length > 1 && (
                    <button 
                      onClick={() => setEntries(entries.filter((_: any, i: number) => i !== idx))}
                      className="absolute -right-2 -top-2 w-7 h-7 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-full flex items-center justify-center shadow-md transition-all z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4 relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account</label>
                      <select 
                        value={entry.accountId}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].accountId = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Select Account</option>
                        {accounts.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Narration</label>
                      <input 
                        placeholder="Entry description"
                        value={entry.narration}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].narration = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Debit</label>
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credit</label>
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Debit</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(totalDr)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credit</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(totalCr)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isBalanced ? "bg-emerald-500" : "bg-rose-500"
                )} />
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isBalanced ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isBalanced ? 'Balanced' : 'Unbalanced'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={onClose} className="btn btn-outline flex-1 sm:flex-none">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={!isBalanced}
                className="btn btn-primary flex-1 sm:flex-none"
              >
                Save Voucher
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Settings Component ---
function SettingsTab({ setAccounts, setVouchers, setPinned, setSeq, accounts, vouchers, pinned, seq, showToast }: any) {
  const handleExport = () => {
    const data = { accounts, vouchers, pinned, seq };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result as string);
        setAccounts(data.accounts || []);
        setVouchers(data.vouchers || []);
        setPinned(data.pinned || []);
        setSeq(data.seq || 0);
        showToast('Data imported successfully', 'success');
      } catch (err) {
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    // Removed confirm() for iframe compatibility
    setAccounts([]);
    setVouchers([]);
    setPinned([]);
    setSeq(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="card p-8 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Data Management</h2>
        <p className="text-sm text-slate-500">Backup your data or reset the application to its initial state.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Backup & Restore</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleExport} className="btn btn-outline flex-1">
              <Download size={18} /> Export Data
            </button>
            <label className="btn btn-outline flex-1 cursor-pointer">
              <ArrowUpRight size={18} /> Import Data
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
          <h3 className="text-sm font-bold text-rose-900 mb-4">Danger Zone</h3>
          <button onClick={handleReset} className="btn bg-rose-600 text-white hover:bg-rose-700 w-full">
            <Trash2 size={18} /> Reset Application
          </button>
        </div>
      </div>
    </div>
  );
}
