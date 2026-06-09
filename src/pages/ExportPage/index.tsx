import { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Download,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileWarning,
  Printer,
  Send,
  X,
  TrendingUp,
  DollarSign,
  XCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '@/lib/utils';

export default function ExportPage() {
  const { carrierBills, confirmBills, discrepancies, addOperationLog, matchingResults } =
    useAppStore();

  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'payment' | 'dispute'>('payment');

  const [modalSelectedBills, setModalSelectedBills] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [excludedExpanded, setExcludedExpanded] = useState(false);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<string[]>(['pending', 'processing', 'disputed']);

  const filteredBills = carrierBills.filter((bill) => {
    if (filterStatus !== 'all' && bill.status !== filterStatus) return false;
    if (searchText) {
      const lower = searchText.toLowerCase();
      if (
        !bill.billNumber.toLowerCase().includes(lower) &&
        !bill.carrierName.toLowerCase().includes(lower) &&
        !bill.vesselName.toLowerCase().includes(lower)
      )
        return false;
    }
    return true;
  });

  const matchedBills = carrierBills.filter((b) => b.status === 'matched');
  const discrepancyBills = carrierBills.filter((b) => b.status === 'discrepancy');
  const confirmedBills = carrierBills.filter((b) => b.status === 'confirmed');
  const pendingBills = carrierBills.filter((b) => b.status === 'pending');

  const paymentReviewData = useMemo(() => {
    const matchedBillsList = carrierBills.filter((b) => b.status === 'matched');
    const selectedMatchedBills = matchedBillsList.filter((b) => modalSelectedBills.includes(b.id));
    
    const totalAmount = selectedMatchedBills.reduce((sum, b) => sum + b.totalAmount, 0);

    const carrierCurrencyGroups = new Map<string, { 
      carrierName: string; 
      currency: string; 
      count: number; 
      amount: number;
      bills: typeof matchedBillsList;
    }>();
    
    matchedBillsList.forEach((bill) => {
      const key = `${bill.carrierName}_${bill.currency}`;
      if (!carrierCurrencyGroups.has(key)) {
        carrierCurrencyGroups.set(key, {
          carrierName: bill.carrierName,
          currency: bill.currency,
          count: 0,
          amount: 0,
          bills: [],
        });
      }
      const group = carrierCurrencyGroups.get(key)!;
      group.count++;
      group.amount += bill.totalAmount;
      group.bills.push(bill);
    });

    const excludedBills = carrierBills.filter((b) => b.status !== 'matched');
    const excludedByStatus = new Map<string, { count: number; bills: typeof excludedBills }>();
    excludedBills.forEach((b) => {
      let label = '';
      let reason = '';
      switch (b.status) {
        case 'confirmed':
          label = '已确认';
          reason = '账单已确认导出';
          break;
        case 'discrepancy':
          label = '有差异';
          reason = '存在待处理的差异项';
          break;
        default:
          label = '待处理';
          reason = '尚未完成匹配核对';
      }
      if (!excludedByStatus.has(label)) {
        excludedByStatus.set(label, { count: 0, bills: [] });
      }
      const group = excludedByStatus.get(label)!;
      group.count++;
      group.bills.push({ ...b, excludedReason: reason } as any);
    });

    const groups = Array.from(carrierCurrencyGroups.entries()).map(([key, data]) => ({
      key,
      carrierName: data.carrierName,
      currency: data.currency,
      count: data.count,
      amount: data.amount,
      bills: data.bills,
    }));

    const allMatchedIds = matchedBillsList.map((b) => b.id);
    const selectedCount = selectedMatchedBills.length;
    const selectedAmount = selectedMatchedBills.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalMatchedCount: matchedBillsList.length,
      selectedCount,
      selectedAmount,
      totalAmount,
      groups,
      allMatchedIds,
      excludedCount: excludedBills.length,
      excludedByStatus: Array.from(excludedByStatus.entries()).map(([status, data]) => ({
        status,
        count: data.count,
        bills: data.bills,
      })),
      selectedBills: selectedMatchedBills,
    };
  }, [carrierBills, modalSelectedBills]);

  const disputeExportData = useMemo(() => {
    const discs = discrepancies.filter((d) => disputeStatusFilter.includes(d.status));
    const totalAmount = discs.reduce((sum, d) => sum + d.diffAmount, 0);

    const typeGroups = new Map<string, { count: number; amount: number }>();
    discs.forEach((disc) => {
      const label = disc.type === 'duplicate' ? '重复收费' : disc.type === 'missing' ? '漏收费用' : disc.type === 'amount-exceed' ? '金额超限' : '币种不一致';
      if (!typeGroups.has(label)) {
        typeGroups.set(label, { count: 0, amount: 0 });
      }
      const group = typeGroups.get(label)!;
      group.count++;
      group.amount += disc.diffAmount;
    });

    return {
      count: discs.length,
      totalAmount,
      typeGroups: Array.from(typeGroups.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        amount: data.amount,
      })),
      discrepancies: discs,
    };
  }, [discrepancies, disputeStatusFilter]);

  const toggleSelectBill = (id: string) => {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectAllMatched = () => {
    const matchedIds = matchedBills.map((b) => b.id);
    setSelectedBills(matchedIds);
  };

  const clearSelection = () => {
    setSelectedBills([]);
  };

  useEffect(() => {
    if (showExportModal && exportType === 'payment') {
      setModalSelectedBills(paymentReviewData.allMatchedIds);
      setExpandedGroups(new Set(paymentReviewData.groups.map((g) => g.key)));
      setExcludedExpanded(false);
    }
  }, [showExportModal, exportType]);

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleModalSelectBill = (id: string) => {
    setModalSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const toggleSelectGroup = (groupKey: string) => {
    const group = paymentReviewData.groups.find((g) => g.key === groupKey);
    if (!group) return;

    const groupIds = group.bills.map((b) => b.id);
    const allSelected = groupIds.every((id) => modalSelectedBills.includes(id));

    setModalSelectedBills((prev) => {
      if (allSelected) {
        return prev.filter((id) => !groupIds.includes(id));
      } else {
        const next = new Set(prev);
        groupIds.forEach((id) => next.add(id));
        return Array.from(next);
      }
    });
  };

  const toggleSelectAllMatched = () => {
    if (paymentReviewData.selectedCount === paymentReviewData.totalMatchedCount) {
      setModalSelectedBills([]);
    } else {
      setModalSelectedBills(paymentReviewData.allMatchedIds);
    }
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(paymentReviewData.groups.map((g) => g.key)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  const handleBatchConfirm = () => {
    if (selectedBills.length === 0) return;

    const confirmable = selectedBills.filter(
      (id) => carrierBills.find((b) => b.id === id)?.status === 'matched'
    );

    const skipped = selectedBills.length - confirmable.length;

    if (confirmable.length === 0) {
      alert('没有可确认的账单，请选择已匹配且无差异的账单');
      return;
    }

    if (skipped > 0) {
      if (!confirm(`已选中 ${selectedBills.length} 张账单，其中 ${confirmable.length} 张可确认（已匹配无差异），${skipped} 张将被跳过（有差异或待处理）。是否继续？`)) {
        return;
      }
    }

    confirmBills(confirmable);
    setSelectedBills([]);

    addOperationLog({
      operationType: '批量确认',
      operator: '张财务',
      description: '批量确认账单',
      detail: `确认了${confirmable.length}张账单，跳过${skipped}张`,
    });
  };

  const handleExportPaymentList = () => {
    const billsToExport = paymentReviewData.selectedBills;
    if (billsToExport.length === 0) {
      alert('请至少选择一张账单');
      return;
    }

    const billIds = billsToExport.map((b) => b.id);
    confirmBills(billIds);

    const exportData = billsToExport.map((bill) => ({
      账单号: bill.billNumber,
      承运商: bill.carrierName,
      船名: bill.vesselName,
      航次号: bill.voyageNumber,
      费用类型: bill.feeType,
      装货港: bill.loadingPort,
      卸货港: bill.dischargePort,
      币种: bill.currency,
      金额: bill.totalAmount,
      确认日期: new Date().toLocaleDateString('zh-CN'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '付款清单');
    XLSX.writeFile(wb, `付款清单_${new Date().toISOString().split('T')[0]}.xlsx`);

    const totalAmount = billsToExport.reduce((sum, b) => sum + b.totalAmount, 0);
    addOperationLog({
      operationType: '导出',
      operator: '张财务',
      description: '导出付款清单',
      detail: `导出${billsToExport.length}条付款记录，合计金额${totalAmount.toLocaleString()}`,
    });

    setShowExportModal(false);
  };

  const handleExportDisputeList = () => {
    const discs = disputeExportData.discrepancies;
    const exportData = discs.map((disc) => {
      const result = matchingResults.find((r) => r.id === disc.matchingResultId);
      const bill = result ? carrierBills.find((b) => b.id === result.carrierBillId) : null;

      return {
        差异类型:
          disc.type === 'duplicate'
            ? '重复收费'
            : disc.type === 'missing'
            ? '漏收费用'
            : disc.type === 'amount-exceed'
            ? '金额超限'
            : '币种不一致',
        账单号: bill?.billNumber || '-',
        承运商: bill?.carrierName || '-',
        差异描述: disc.description,
        差异金额: disc.diffAmount,
        差异比例: disc.diffPercent.toFixed(2) + '%',
        状态:
          disc.status === 'pending'
            ? '待处理'
            : disc.status === 'processing'
            ? '处理中'
            : disc.status === 'resolved'
            ? '已解决'
            : '有争议',
        处理意见: disc.comment || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '争议清单');
    XLSX.writeFile(wb, `争议清单_${new Date().toISOString().split('T')[0]}.xlsx`);

    const statusLabels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      disputed: '有争议',
      resolved: '已解决',
    };
    const statusRange = disputeStatusFilter.map((s) => statusLabels[s]).join('、');

    addOperationLog({
      operationType: '导出',
      operator: '张财务',
      description: '导出争议清单',
      detail: `状态范围：${statusRange}，导出${discs.length}条争议记录，涉及金额¥${disputeExportData.totalAmount.toLocaleString()}`,
    });

    setShowExportModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
            已确认
          </span>
        );
      case 'matched':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            已匹配
          </span>
        );
      case 'discrepancy':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            有差异
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
            待处理
          </span>
        );
    }
  };

  const stats = [
    { label: '已确认账单', count: confirmedBills.length, icon: CheckCircle2, color: 'emerald' },
    { label: '已匹配待确认', count: matchedBills.length, icon: CheckSquare, color: 'blue' },
    { label: '有差异', count: discrepancyBills.length, icon: AlertCircle, color: 'amber' },
    { label: '待处理', count: pendingBills.length, icon: FileText, color: 'slate' },
  ];

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: 'bg-emerald-500',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: 'bg-amber-500',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      icon: 'bg-slate-500',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">确认导出</h1>
          <p className="text-sm text-slate-500 mt-1">
            批量确认无误账单，生成付款清单和争议清单
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setExportType('payment');
              setShowExportModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <FileSpreadsheet className="w-4 h-4" />
            导出付款清单
          </button>
          <button
            onClick={() => {
              setExportType('dispute');
              setShowExportModal(true);
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <FileWarning className="w-4 h-4" />
            导出争议清单
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color as keyof typeof colorClasses];
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    colors.icon
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
                  <p className={cn('text-sm', colors.text)}>{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Action Bar */}
      {selectedBills.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-cyan-800">
              已选择 <span className="font-bold">{selectedBills.length}</span> 张账单
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm text-cyan-700 hover:bg-cyan-100 rounded-lg"
            >
              取消选择
            </button>
            <button
              onClick={handleBatchConfirm}
              className="px-4 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              批量确认
            </button>
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="font-semibold text-slate-800">账单列表</h3>

            <div className="flex items-center gap-2 ml-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="all">全部状态</option>
                <option value="confirmed">已确认</option>
                <option value="matched">已匹配</option>
                <option value="discrepancy">有差异</option>
                <option value="pending">待处理</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAllMatched}
                className="text-sm text-cyan-600 hover:text-cyan-700"
              >
                全选已匹配
              </button>
            </div>

            <div className="flex-1 max-w-xs ml-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索账单号、承运商、船名..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-600 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedBills.length === filteredBills.length && filteredBills.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBills(filteredBills.map((b) => b.id));
                      } else {
                        setSelectedBills([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">账单号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">承运商</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">船名/航次</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">费用类型</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">装卸港</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">金额</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">状态</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无账单数据</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(bill.id)}
                        onChange={() => toggleSelectBill(bill.id)}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">{bill.billNumber}</td>
                    <td className="px-4 py-4 text-slate-600">{bill.carrierName}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {bill.vesselName} / {bill.voyageNumber}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{bill.feeType}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {bill.loadingPort} → {bill.dischargePort}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-800">
                      {bill.currency} {bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4 text-center">
                      {bill.status !== 'confirmed' ? (
                        <button
                          onClick={() => {
                            confirmBills([bill.id]);
                            addOperationLog({
                              operationType: '单条确认',
                              operator: '张财务',
                              description: '确认账单',
                              detail: `确认账单${bill.billNumber}`,
                            });
                          }}
                          className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                        >
                          确认
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">已确认</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            共 {filteredBills.length} 条记录
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              上一页
            </button>
            <span className="px-3 py-1.5 text-sm bg-cyan-50 text-cyan-700 rounded-lg font-medium">
              1
            </span>
            <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Export Review Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">
                  {exportType === 'payment' ? '付款清单导出复核' : '争议清单导出复核'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">请确认导出内容无误后再执行导出</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {exportType === 'payment' ? (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-slate-700 to-blue-800 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        <FileSpreadsheet className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">本次将导出付款账单</p>
                        <p className="text-2xl font-bold mt-1">
                          {paymentReviewData.selectedCount} / {paymentReviewData.totalMatchedCount} 张
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">合计金额</p>
                        <p className="text-2xl font-bold mt-1">
                          {paymentReviewData.groups.length > 0
                            ? `${paymentReviewData.groups[0].currency} ${paymentReviewData.selectedAmount.toLocaleString()}`
                            : '0'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        账单列表
                      </h4>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentReviewData.selectedCount === paymentReviewData.totalMatchedCount && paymentReviewData.totalMatchedCount > 0}
                            onChange={toggleSelectAllMatched}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600">全选</span>
                        </label>
                        <div className="w-px h-4 bg-slate-300" />
                        <button
                          onClick={expandAllGroups}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          全部展开
                        </button>
                        <button
                          onClick={collapseAllGroups}
                          className="text-sm text-slate-500 hover:text-slate-600"
                        >
                          全部收起
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {paymentReviewData.groups.map((group) => {
                        const isExpanded = expandedGroups.has(group.key);
                        const groupIds = group.bills.map((b) => b.id);
                        const allSelected = groupIds.every((id) => modalSelectedBills.includes(id));
                        const someSelected = groupIds.some((id) => modalSelectedBills.includes(id));

                        return (
                          <div
                            key={group.key}
                            className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                          >
                            <div
                              className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 flex items-center gap-3 cursor-pointer hover:from-slate-100 hover:to-blue-100 transition-colors"
                              onClick={() => toggleGroupExpand(group.key)}
                            >
                              <div className="flex items-center justify-center w-6 h-6">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = someSelected && !allSelected;
                                }}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectGroup(group.key);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-slate-800">{group.carrierName}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                  {group.currency}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800">
                                  {group.currency} {group.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">{group.count} 张账单</p>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-200">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-10"></th>
                                      <th className="px-3 py-2 text-left font-medium text-slate-600">账单号</th>
                                      <th className="px-3 py-2 text-left font-medium text-slate-600">船名/航次</th>
                                      <th className="px-3 py-2 text-left font-medium text-slate-600">费用类型</th>
                                      <th className="px-4 py-2 text-right font-medium text-slate-600">金额</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.bills.map((bill) => (
                                      <tr
                                        key={bill.id}
                                        className={cn(
                                          'hover:bg-blue-50/50 transition-colors',
                                          modalSelectedBills.includes(bill.id) && 'bg-blue-50/30'
                                        )}
                                      >
                                        <td className="px-4 py-2.5">
                                          <input
                                            type="checkbox"
                                            checked={modalSelectedBills.includes(bill.id)}
                                            onChange={() => toggleModalSelectBill(bill.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800">{bill.billNumber}</td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                          {bill.vesselName} / {bill.voyageNumber}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">{bill.feeType}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                                          {bill.currency} {bill.totalAmount.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {paymentReviewData.groups.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm text-slate-400">暂无已匹配的账单</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {paymentReviewData.excludedCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
                        onClick={() => setExcludedExpanded(!excludedExpanded)}
                      >
                        <div className="flex items-center gap-2">
                          {excludedExpanded ? (
                            <ChevronDown className="w-4 h-4 text-amber-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-amber-600" />
                          )}
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">
                            以下账单将被排除（{paymentReviewData.excludedCount} 张）
                          </span>
                        </div>
                        <span className="text-xs text-amber-600">
                          {excludedExpanded ? '收起' : '展开查看详情'}
                        </span>
                      </div>

                      {excludedExpanded && (
                        <div className="border-t border-amber-200">
                          {paymentReviewData.excludedByStatus.map((statusGroup) => (
                            <div key={statusGroup.status} className="border-b border-amber-200 last:border-b-0">
                              <div className="px-4 py-2 bg-amber-100/50">
                                <span className="text-sm font-medium text-amber-700">
                                  {statusGroup.status}（{statusGroup.count} 张）
                                </span>
                              </div>
                              <div className="max-h-48 overflow-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-amber-50/80 sticky top-0">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-amber-700 text-xs">账单号</th>
                                      <th className="px-3 py-2 text-left font-medium text-amber-700 text-xs">承运商</th>
                                      <th className="px-3 py-2 text-right font-medium text-amber-700 text-xs">金额</th>
                                      <th className="px-4 py-2 text-left font-medium text-amber-700 text-xs">排除原因</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-amber-100">
                                    {statusGroup.bills.map((bill: any) => (
                                      <tr key={bill.id} className="hover:bg-amber-50/50">
                                        <td className="px-4 py-2 text-slate-700 font-medium">{bill.billNumber}</td>
                                        <td className="px-3 py-2 text-slate-600">{bill.carrierName}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">
                                          {bill.currency} {bill.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-amber-600 text-xs">{bill.excludedReason}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!excludedExpanded && (
                        <div className="px-4 pb-3 flex flex-wrap gap-2">
                          {paymentReviewData.excludedByStatus.map((statusGroup) => (
                            <span
                              key={statusGroup.status}
                              className="px-3 py-1 bg-white rounded-lg text-sm text-amber-700 border border-amber-200"
                            >
                              {statusGroup.status}：{statusGroup.count} 张
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-slate-700 to-blue-800 rounded-xl p-5 text-white">
                    <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      选择导出状态
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'pending', label: '待处理', color: 'slate' },
                        { value: 'processing', label: '处理中', color: 'blue' },
                        { value: 'disputed', label: '有争议', color: 'amber' },
                        { value: 'resolved', label: '已解决', color: 'emerald' },
                      ].map((status) => (
                          <label
                            key={status.value}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                              disputeStatusFilter.includes(status.value)
                                ? 'bg-white/20 border border-white/30'
                                : 'bg-white/5 border border-transparent hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={disputeStatusFilter.includes(status.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDisputeStatusFilter((prev) => [...prev, status.value]);
                                } else {
                                  setDisputeStatusFilter((prev) =>
                                    prev.filter((s) => s !== status.value)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-white/40 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 bg-white/20"
                            />
                            <span className="text-sm font-medium">{status.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        <FileWarning className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">本次导出争议记录</p>
                        <p className="text-2xl font-bold mt-1">
                          {disputeExportData.count} 条差异
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">涉及金额</p>
                        <p className="text-2xl font-bold mt-1">
                          ¥{disputeExportData.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      差异类型分布
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {disputeExportData.typeGroups.map((group) => (
                        <div key={group.type} className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs text-slate-500">{group.type}</p>
                          <p className="text-lg font-bold text-slate-800 mt-1">{group.count}</p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            涉及 ¥{group.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {disputeExportData.typeGroups.length === 0 && (
                        <div className="col-span-4 text-center py-4 text-slate-400 text-sm">
                          暂无差异记录
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      导出明细（{disputeExportData.count} 条）
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-60 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-600">差异类型</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-600">描述</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-600">状态</th>
                              <th className="px-4 py-2.5 text-right font-medium text-slate-600">差异金额</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {disputeExportData.discrepancies.map((disc) => (
                              <tr key={disc.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                    {disc.type === 'duplicate'
                                      ? '重复收费'
                                      : disc.type === 'missing'
                                      ? '漏收费用'
                                      : disc.type === 'amount-exceed'
                                      ? '金额超限'
                                      : '币种不一致'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{disc.description}</td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  {disc.status === 'pending'
                                    ? '待处理'
                                    : disc.status === 'processing'
                                    ? '处理中'
                                    : disc.status === 'disputed'
                                    ? '有争议'
                                    : '已解决'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-amber-600 font-medium">
                                  {disc.diffAmount > 0 ? `+${disc.diffAmount.toLocaleString()}` : '-'}
                                </td>
                              </tr>
                            ))}
                            {disputeExportData.discrepancies.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                  暂无争议记录
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-slate-500">
                {exportType === 'payment' ? (
                  <>
                    <span className="text-blue-600 font-medium">
                      {paymentReviewData.selectedCount}
                    </span>
                    张账单将被确认并导出为 Excel 文件，合计金额
                    <span className="text-blue-600 font-medium ml-1">
                      {paymentReviewData.selectedAmount.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-600 font-medium">
                      {disputeExportData.count}
                    </span>
                    条记录将被导出为 Excel 文件
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={exportType === 'payment' ? handleExportPaymentList : handleExportDisputeList}
                  disabled={exportType === 'payment' ? paymentReviewData.selectedCount === 0 : disputeExportData.count === 0}
                  className="px-6 py-2 bg-gradient-to-r from-slate-700 to-blue-800 text-white text-sm font-medium rounded-lg hover:from-slate-800 hover:to-blue-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  <Download className="w-4 h-4" />
                  确认导出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
