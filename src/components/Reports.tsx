import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  Table as TableIcon, 
  Calendar,
  ChevronDown,
  Filter,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth } from 'date-fns';
import { cn, formatCurrency, highlightText } from '../lib/utils';
import { Account, Voucher, ReportData, ReportTransaction } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportsProps {
  accounts: Account[];
  vouchers: Voucher[];
}

export default function Reports({ accounts, vouchers }: ReportsProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [accSearch, setAccSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
          allTxns.push({ ...e, date: v.date, vId: v.id, vNarr: v.narration });
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
          narration: t.narration || t.vNarr || '',
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

    let csv = `CashLedger - Account Statement\n`;
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
    doc.text('CashLedger', 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Financial Statement', 14, 36);

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
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Filter size={18} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Report Parameters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Account</label>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-all"
              >
                <span className="truncate">
                  {selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'Choose an account...'}
                </span>
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={accSearch}
                        onChange={(e) => setAccSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-height-[240px] overflow-y-auto">
                    {filteredAccounts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedAccountId(a.id);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between",
                          selectedAccountId === a.id && "bg-blue-50 text-blue-700 font-semibold"
                        )}
                      >
                        <span>{a.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{a.type}</span>
                      </button>
                    ))}
                    {filteredAccounts.length === 0 && (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">No accounts found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generateReport}
          disabled={!selectedAccountId}
          className="w-full mt-8 btn btn-primary py-3 text-sm font-bold tracking-wide"
        >
          Generate Statement
          <ArrowRight size={18} />
        </button>
      </div>

      {reportData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Find in narration or ref..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={exportCSV}
                className="flex-1 sm:flex-none btn btn-outline px-6 py-2.5 text-sm font-bold shadow-sm hover:shadow-md"
              >
                <TableIcon size={18} className="text-emerald-600" />
                CSV
              </button>
              <button 
                onClick={exportPDF}
                className="flex-1 sm:flex-none btn btn-outline px-6 py-2.5 text-sm font-bold shadow-sm hover:shadow-md"
              >
                <FileText size={18} className="text-rose-600" />
                PDF
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening</p>
                  <p className={cn("text-sm font-bold", reportData.openingBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {formatCurrency(reportData.openingBalance)}
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closing</p>
                  <p className={cn(
                    "text-sm font-bold", 
                    (reportData.transactions.length > 0 ? reportData.transactions[reportData.transactions.length - 1].currentBalance : reportData.openingBalance) >= 0 
                      ? "text-emerald-600" 
                      : "text-rose-600"
                  )}>
                    {formatCurrency(reportData.transactions.length > 0 ? reportData.transactions[reportData.transactions.length - 1].currentBalance : reportData.openingBalance)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
                Showing {filteredTransactions.length} entries
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-compact">
                <thead>
                  <tr>
                    <th className="w-24">Date</th>
                    <th className="w-20">Ref</th>
                    <th>Narration</th>
                    <th className="text-right w-28">Debit</th>
                    <th className="text-right w-28">Credit</th>
                    <th className="text-right w-32">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-amber-50/30">
                    <td className="px-3 py-2 text-xs text-slate-500">{reportData.fromDate}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">-</td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-700 italic">Opening Balance</td>
                    <td className="px-3 py-2 text-right text-slate-400">-</td>
                    <td className="px-3 py-2 text-right text-slate-400">-</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-amber-600">
                      {formatCurrency(reportData.openingBalance)}
                    </td>
                  </tr>
                  {paginatedTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 text-xs text-slate-600">{t.date}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-900">{highlightText(t.vId, searchQuery)}</td>
                      <td className="px-3 py-2 text-sm text-slate-600 max-w-xs truncate" title={t.narration}>
                        {highlightText(t.narration, searchQuery)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-600">
                        {t.dr > 0 ? formatCurrency(t.dr) : '0.00'}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-600">
                        {t.cr > 0 ? formatCurrency(t.cr) : '0.00'}
                      </td>
                      <td className={cn(
                        "px-3 py-2 text-right text-sm font-bold",
                        t.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {formatCurrency(t.currentBalance)}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                        No transactions found in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold">{filteredTransactions.length}</span> entries
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
        </div>
      )}
    </div>
  );
}
