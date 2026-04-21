import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  Table as TableIcon, 
  Calendar,
  ChevronDown,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Clock,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, differenceInDays } from 'date-fns';
import { cn, formatCurrency, highlightText } from '../lib/utils';
import { Account, Voucher, ReportData, ReportTransaction, BusinessSettings } from '../types';

interface ReportsProps {
  accounts: Account[];
  vouchers: Voucher[];
  businessSettings: BusinessSettings;
}

type ReportType = 'statement' | 'aging' | 'trial';

export default function Reports({ accounts, vouchers, businessSettings }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('statement');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [accSearch, setAccSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // --- Trial Balance Logic ---
  const trialBalance = useMemo(() => {
    return accounts.map(acc => {
      let totalDr = Number(acc.openingBalance) > 0 ? Number(acc.openingBalance) : 0;
      let totalCr = Number(acc.openingBalance) < 0 ? Math.abs(Number(acc.openingBalance)) : 0;

      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountId === acc.id) {
            totalDr += Number(e.dr) || 0;
            totalCr += Number(e.cr) || 0;
          }
        });
      });

      const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank', 'Customer'].includes(acc.type);
      const balance = isDebitNormal ? (totalDr - totalCr) : (totalCr - totalDr);

      return {
        ...acc,
        totalDr,
        totalCr,
        balance
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, vouchers]);

  // --- Aging Report Logic ---
  const agingReport = useMemo(() => {
    const customers = accounts.filter(a => a.type === 'Customer');
    const today = new Date();

    return customers.map(acc => {
      const buckets = {
        current: 0, // 0-30
        aging31_45: 0,
        aging46_60: 0,
        aging60plus: 0,
        total: 0
      };

      // Get all transactions for this customer
      const txns: any[] = [];
      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountId === acc.id) {
            txns.push({ ...e, date: v.date });
          }
        });
      });

      // Simplified aging: we assume FIFO or just bucket the net balance by transaction dates
      // For a proper aging, we should track which invoices are unpaid. 
      // Here we'll bucket based on transaction dates.
      
      const openingBal = Number(acc.openingBalance) || 0;
      buckets.total = openingBal;
      
      // Add opening balance to 60+ if it's old, or current if it's new? 
      // Usually opening balance is considered old.
      buckets.aging60plus += openingBal;

      txns.forEach(t => {
        const dr = Number(t.dr) || 0;
        const cr = Number(t.cr) || 0;
        const net = dr - cr;
        buckets.total += net;

        const days = differenceInDays(today, new Date(t.date));
        if (days <= 30) buckets.current += net;
        else if (days <= 45) buckets.aging31_45 += net;
        else if (days <= 60) buckets.aging46_60 += net;
        else buckets.aging60plus += net;
      });

      return {
        ...acc,
        ...buckets
      };
    }).filter(a => Math.abs(a.total) > 0.01);
  }, [accounts, vouchers]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.name.toLowerCase().includes(accSearch.toLowerCase()) || 
      a.type.toLowerCase().includes(accSearch.toLowerCase())
    );
  }, [accounts, accSearch]);

  const generateReport = () => {
    if (!selectedAccountId) return;

    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!acc) return;

    const isDebitNormal = ['Asset', 'Expense', 'Cash', 'Bank'].includes(acc.type);
    
    // Get all transactions for this account
    const allTxns: any[] = [];
    vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (e.accountId === selectedAccountId) {
          allTxns.push({ ...e, date: v.date, vId: v.id });
        }
      });
    });
    
    allTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const filteredTxns: ReportTransaction[] = [];
    let currentBalance = Number(acc.openingBalance) || 0;
    
    // Calculate opening balance at fromDate
    allTxns.forEach(t => {
      if (t.date < fromDate) {
        const dr = Number(t.dr) || 0;
        const cr = Number(t.cr) || 0;
        currentBalance += isDebitNormal ? (dr - cr) : (cr - dr);
      }
    });

    const openingBalance = currentBalance;

    // Collect transactions within range
    allTxns.forEach(t => {
      if (t.date >= fromDate && t.date <= toDate) {
        const dr = Number(t.dr) || 0;
        const cr = Number(t.cr) || 0;
        currentBalance += isDebitNormal ? (dr - cr) : (cr - dr);
        filteredTxns.push({
          date: t.date,
          vId: t.vId,
          narration: t.narration || '',
          dr,
          cr,
          currentBalance
        });
      }
    });

    setReportData({
      account: acc,
      fromDate,
      toDate,
      openingBalance,
      transactions: filteredTxns,
      isDebitNormal
    });
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (!reportData) return;
    const { account, fromDate, toDate, openingBalance, transactions } = reportData;
    
    const totalDr = transactions.reduce((s, t) => s + t.dr, 0);
    const totalCr = transactions.reduce((s, t) => s + t.cr, 0);
    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].currentBalance : openingBalance;

    let csv = `${businessSettings.name} - Account Statement\n`;
    csv += `Account Name,${account.name}\n`;
    csv += `Account Type,${account.type}\n`;
    csv += `Period,${fromDate} to ${toDate}\n`;
    csv += `Generated On,${new Date().toLocaleString()}\n\n`;
    
    csv += `Summary\n`;
    csv += `Opening Balance,${openingBalance.toFixed(2)}\n`;
    csv += `Total Debit,${totalDr.toFixed(2)}\n`;
    csv += `Total Credit,${totalCr.toFixed(2)}\n`;
    csv += `Closing Balance,${closingBalance.toFixed(2)}\n\n`;

    csv += `Transaction Details\n`;
    csv += `Date,Ref,Narration,Debit,Credit,Balance\n`;
    csv += `${fromDate},-,Opening Balance,0.00,0.00,${openingBalance.toFixed(2)}\n`;
    
    transactions.forEach(t => {
      csv += `${t.date},${t.vId},"${t.narration.replace(/"/g, '""')}",${t.dr.toFixed(2)},${t.cr.toFixed(2)},${t.currentBalance.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Statement_${account.name}_${fromDate}_to_${toDate}.csv`;
    link.click();
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const { account, fromDate, toDate, openingBalance, transactions } = reportData;

    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
    const secondaryColor: [number, number, number] = [15, 23, 42]; // #0f172a
    const mutedColor: [number, number, number] = [100, 116, 139]; // #64748b

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(businessSettings.name, 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(businessSettings.address || 'Professional Financial Statement', 14, 36);

    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCOUNT STATEMENT', 210 - 14, 30, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 210 - 14, 36, { align: 'right' });

    // Account Info
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 210 - 14, 45);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Details:', 14, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${account.name}`, 14, 62);
    doc.text(`Type: ${account.type}`, 14, 68);

    doc.setFont('helvetica', 'bold');
    doc.text('Statement Period:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`From: ${fromDate}`, 120, 62);
    doc.text(`To: ${toDate}`, 120, 68);

    // Summary
    const totalDr = transactions.reduce((s, t) => s + t.dr, 0);
    const totalCr = transactions.reduce((s, t) => s + t.cr, 0);
    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].currentBalance : openingBalance;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 75, 182, 25, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('OPENING BALANCE', 25, 85);
    doc.text('TOTAL DEBIT', 75, 85);
    doc.text('TOTAL CREDIT', 125, 85);
    doc.text('CLOSING BALANCE', 165, 85);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${openingBalance.toFixed(2)}`, 25, 92);
    doc.text(`${totalDr.toFixed(2)}`, 75, 92);
    doc.text(`${totalCr.toFixed(2)}`, 125, 92);
    doc.text(`${closingBalance.toFixed(2)}`, 165, 92);

    // Table
    const tableData = [
      [fromDate, '-', 'Opening Balance', '0.00', '0.00', openingBalance.toFixed(2)]
    ];

    transactions.forEach(t => {
      tableData.push([
        t.date,
        t.vId,
        t.narration,
        t.dr.toFixed(2),
        t.cr.toFixed(2),
        t.currentBalance.toFixed(2)
      ]);
    });

    autoTable(doc, {
      startY: 110,
      head: [['Date', 'Ref', 'Narration', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [255, 251, 235]; // amber-50
        }
      }
    });

    doc.save(`Statement_${account.name}_${fromDate}_to_${toDate}.pdf`);
  };

  const filteredTransactions = useMemo(() => {
    if (!reportData) return [];
    return reportData.transactions.filter(t => 
      t.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reportData, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-10">
      {/* Report Type Switcher */}
      <div className="flex p-2 bg-slate-100/50 backdrop-blur-sm rounded-[2rem] border border-slate-200/50 w-fit mx-auto shadow-inner">
        {[
          { id: 'statement', label: 'Account Statement', icon: FileText },
          { id: 'aging', label: 'Aging Report', icon: Clock },
          { id: 'trial', label: 'Trial Balance', icon: Scale }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setReportType(type.id as ReportType);
              setReportData(null);
            }}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-500 tracking-tight",
              reportType === type.id 
                ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100 border border-indigo-100" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            )}
          >
            <type.icon size={18} />
            {type.label}
          </button>
        ))}
      </div>

      {reportType === 'statement' && (
        <>
          <div className="surface-glass p-10 rounded-[3rem] border border-white/50 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200/50 group-hover:rotate-3 transition-transform duration-500">
                <Filter size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Account Statement</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Generate professional financial reports</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Select Account</label>
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-indigo-400 hover:ring-4 hover:ring-indigo-500/5 transition-all shadow-sm"
                  >
                    <span className="truncate">
                      {selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'Choose an account...'}
                    </span>
                    <ChevronDown size={20} className={cn("text-slate-400 transition-transform duration-500", isDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl z-[60] overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                          <div className="relative group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                              type="text"
                              placeholder="Search accounts..."
                              className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold"
                              value={accSearch}
                              onChange={(e) => setAccSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto p-3 space-y-1">
                          {filteredAccounts.map(a => (
                            <button
                              key={a.id}
                              onClick={() => {
                                setSelectedAccountId(a.id);
                                setIsDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-5 py-4 text-sm rounded-xl transition-all flex items-center justify-between group/item",
                                selectedAccountId === a.id 
                                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200" 
                                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                              )}
                            >
                              <span className="font-bold tracking-tight">{a.name}</span>
                              <span className={cn(
                                "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest transition-colors",
                                selectedAccountId === a.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover/item:bg-white"
                              )}>
                                {a.type}
                              </span>
                            </button>
                          ))}
                          {filteredAccounts.length === 0 && (
                            <div className="px-4 py-16 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                <Search size={28} className="text-slate-200" />
                              </div>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">No accounts found</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">From Date</label>
                <div className="relative group">
                  <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="input-styling pl-14 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">To Date</label>
                <div className="relative group">
                  <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="input-styling pl-14 font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={generateReport}
              disabled={!selectedAccountId}
              className="w-full mt-12 btn btn-primary py-5 text-base font-black tracking-[0.2em] shadow-2xl shadow-indigo-200/50 disabled:opacity-30 disabled:shadow-none transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              GENERATE STATEMENT
              <ArrowRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {reportData && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="relative flex-1 w-full max-w-xl group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search within transactions..." 
                    className="input-styling pl-14 font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-5 w-full lg:w-auto">
                  <button 
                    onClick={exportCSV}
                    className="flex-1 lg:flex-none btn btn-outline px-10 py-4.5 text-xs font-black tracking-widest shadow-sm hover:shadow-2xl hover:shadow-emerald-100 transition-all bg-white group"
                  >
                    <TableIcon size={20} className="text-emerald-600 mr-3 group-hover:scale-110 transition-transform" />
                    EXPORT CSV
                  </button>
                  <button 
                    onClick={exportPDF}
                    className="flex-1 lg:flex-none btn btn-outline px-10 py-4.5 text-xs font-black tracking-widest shadow-sm hover:shadow-2xl hover:shadow-rose-100 transition-all bg-white group"
                  >
                    <FileText size={20} className="text-rose-600 mr-3 group-hover:scale-110 transition-transform" />
                    EXPORT PDF
                  </button>
                </div>
              </div>

              <div className="card overflow-hidden border-none shadow-2xl shadow-slate-200/60 rounded-[3rem]">
                <div className="p-12 bg-white border-b border-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                  
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 relative z-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm border border-slate-200/50">
                          {reportData.account.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{reportData.account.name}</h3>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100/50">
                              {reportData.account.type}
                            </span>
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            <p className="text-sm text-slate-500 font-bold flex items-center gap-2.5">
                              <Calendar size={18} className="text-slate-400" />
                              <span className="tracking-tight">{format(new Date(reportData.fromDate), 'MMM dd, yyyy')} — {format(new Date(reportData.toDate), 'MMM dd, yyyy')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 bg-slate-50/80 p-10 rounded-[2.5rem] border border-slate-100/50 backdrop-blur-sm shadow-inner">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opening Balance</p>
                        <p className={cn("text-3xl font-black tabular-nums tracking-tighter", reportData.openingBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {formatCurrency(reportData.openingBalance)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Closing Balance</p>
                        <p className={cn(
                          "text-3xl font-black tabular-nums tracking-tighter", 
                          (reportData.transactions.length > 0 ? reportData.transactions[reportData.transactions.length - 1].currentBalance : reportData.openingBalance) >= 0 
                            ? "text-emerald-600" 
                            : "text-rose-600"
                        )}>
                          {formatCurrency(reportData.transactions.length > 0 ? reportData.transactions[reportData.transactions.length - 1].currentBalance : reportData.openingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-compact">
                    <thead>
                      <tr>
                        <th className="px-10 py-6">Date</th>
                        <th className="px-10 py-6">Ref</th>
                        <th className="px-10 py-6">Narration</th>
                        <th className="px-10 py-6 text-right">Debit</th>
                        <th className="px-10 py-6 text-right">Credit</th>
                        <th className="px-10 py-6 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="bg-amber-50/30">
                        <td className="px-10 py-5 text-xs font-bold text-slate-500">{reportData.fromDate}</td>
                        <td className="px-10 py-5 text-xs font-black text-slate-300">—</td>
                        <td className="px-10 py-5 text-sm font-black text-amber-700/70 italic tracking-tight">Opening Balance</td>
                        <td className="px-10 py-5 text-right text-slate-300 font-mono">—</td>
                        <td className="px-10 py-5 text-right text-slate-300 font-mono">—</td>
                        <td className="px-10 py-5 text-right text-base font-black text-amber-600 tabular-nums tracking-tight">
                          {formatCurrency(reportData.openingBalance)}
                        </td>
                      </tr>
                      {paginatedTransactions.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-all duration-300 group">
                          <td className="px-10 py-6 text-xs font-bold text-slate-600">{t.date}</td>
                          <td className="px-10 py-6 text-xs font-black text-slate-900 tracking-tight">
                            <span className="px-3 py-1.5 bg-slate-100 rounded-xl group-hover:bg-white transition-colors border border-slate-200/50">
                              {highlightText(t.vId, searchQuery)}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <p className="text-sm font-bold text-slate-700 max-w-md truncate tracking-tight" title={t.narration}>
                              {highlightText(t.narration, searchQuery)}
                            </p>
                          </td>
                          <td className="px-10 py-6 text-right text-sm font-bold text-slate-600 tabular-nums">
                            {t.dr > 0 ? formatCurrency(t.dr) : <span className="text-slate-200 font-mono">—</span>}
                          </td>
                          <td className="px-10 py-6 text-right text-sm font-bold text-slate-600 tabular-nums">
                            {t.cr > 0 ? formatCurrency(t.cr) : <span className="text-slate-200 font-mono">—</span>}
                          </td>
                          <td className={cn(
                            "px-10 py-6 text-right text-base font-black tabular-nums tracking-tight",
                            t.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {formatCurrency(t.currentBalance)}
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-10 py-40 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[3rem] flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                                <Search size={36} />
                              </div>
                              <p className="text-xl font-black text-slate-600 tracking-tight">No transactions found</p>
                              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium">Try adjusting your search query or date range to find what you're looking for.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-12 py-10 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-8 bg-slate-50/30">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="text-slate-900">{filteredTransactions.length}</span> entries
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="w-14 h-14 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex items-center gap-3">
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
                                "w-14 h-14 rounded-2xl text-sm font-black transition-all border shadow-sm",
                                currentPage === pageNum 
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200" 
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
                        className="w-14 h-14 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {reportType === 'aging' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Aging Report</h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Customer outstanding by age</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">0-30 Days</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">31-45 Days</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">46-60 Days</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">60+ Days</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right bg-slate-100/50">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agingReport.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{row.name}</td>
                    <td className="px-8 py-4 text-right font-medium text-slate-600">{formatCurrency(row.current)}</td>
                    <td className="px-8 py-4 text-right font-medium text-slate-600">{formatCurrency(row.aging31_45)}</td>
                    <td className="px-8 py-4 text-right font-medium text-slate-600">{formatCurrency(row.aging46_60)}</td>
                    <td className="px-8 py-4 text-right font-medium text-slate-600">{formatCurrency(row.aging60plus)}</td>
                    <td className="px-8 py-4 text-right font-black text-indigo-600 bg-indigo-50/30">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'trial' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trial Balance</h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Summary of all account balances</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total Debit</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total Credit</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right bg-slate-100/50">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{row.name}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-medium text-emerald-600">{formatCurrency(row.totalDr)}</td>
                    <td className="px-8 py-4 text-right font-medium text-rose-600">{formatCurrency(row.totalCr)}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-900 bg-slate-50/50">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/50 font-black">
                  <td colSpan={2} className="px-8 py-6 text-slate-900 uppercase tracking-widest text-xs">Grand Total</td>
                  <td className="px-8 py-6 text-right text-emerald-600">{formatCurrency(trialBalance.reduce((s, r) => s + r.totalDr, 0))}</td>
                  <td className="px-8 py-6 text-right text-rose-600">{formatCurrency(trialBalance.reduce((s, r) => s + r.totalCr, 0))}</td>
                  <td className="px-8 py-6 text-right text-slate-900">
                    {formatCurrency(trialBalance.reduce((s, r) => s + (['Asset', 'Expense', 'Cash', 'Bank', 'Customer'].includes(r.type) ? r.balance : -r.balance), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
