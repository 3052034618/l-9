import { useState } from 'react';
import {
  CheckSquare,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  FileWarning,
  Printer,
  Send,
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
    const confirmed = carrierBills.filter((b) => b.status === 'confirmed');
    const exportData = confirmed.map((bill) => ({
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

    addOperationLog({
      operationType: '导出',
      operator: '张财务',
      description: '导出付款清单',
      detail: `导出${confirmed.length}条付款记录`,
    });

    setShowExportModal(false);
  };

  const handleExportDisputeList = () => {
    const disputedDiscs = discrepancies.filter((d) => d.status === 'disputed' || d.status === 'pending');
    const exportData = disputedDiscs.map((disc) => {
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

    addOperationLog({
      operationType: '导出',
      operator: '张财务',
      description: '导出争议清单',
      detail: `导出${disputedDiscs.length}条争议记录`,
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                {exportType === 'payment' ? '导出付款清单' : '导出争议清单'}
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-6">
                {exportType === 'payment' ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-700 font-medium mb-1">付款清单</p>
                    <p className="text-sm text-slate-500">
                      将导出 {confirmedBills.length} 条已确认的账单记录
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <FileWarning className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-slate-700 font-medium mb-1">争议清单</p>
                    <p className="text-sm text-slate-500">
                      将导出 {discrepancies.filter((d) => d.status !== 'resolved').length} 条差异记录
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Download className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Excel 格式</p>
                    <p className="text-xs text-slate-400">.xlsx 文件，可直接用 Excel 打开</p>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">推荐</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={exportType === 'payment' ? handleExportPaymentList : handleExportDisputeList}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
