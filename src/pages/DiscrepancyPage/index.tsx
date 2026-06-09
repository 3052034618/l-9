import { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  FileMinus,
  DollarSign,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  TrendingUp,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DiscrepancyType, DiscrepancyStatus } from '../../types';
import { cn } from '@/lib/utils';

const discrepancyTypes: { type: DiscrepancyType; label: string; icon: any; color: string }[] = [
  { type: 'duplicate', label: '重复收费', icon: Copy, color: 'red' },
  { type: 'missing', label: '漏收费用', icon: FileMinus, color: 'amber' },
  { type: 'amount-exceed', label: '金额超限', icon: DollarSign, color: 'orange' },
  { type: 'currency-mismatch', label: '币种不一致', icon: Globe, color: 'purple' },
];

const statusOptions: { value: DiscrepancyStatus; label: string; icon: any; color: string }[] = [
  { value: 'pending', label: '待处理', icon: Clock, color: 'slate' },
  { value: 'processing', label: '处理中', icon: AlertCircle, color: 'amber' },
  { value: 'resolved', label: '已解决', icon: CheckCircle2, color: 'emerald' },
  { value: 'disputed', label: '有争议', icon: XCircle, color: 'red' },
];

export default function DiscrepancyPage() {
  const {
    discrepancies,
    updateDiscrepancyComment,
    updateDiscrepancyStatus,
    matchingResults,
    carrierBills,
    voyageDetails,
    portFees,
    bunkerFees,
    addOperationLog,
  } = useAppStore();

  const [filterType, setFilterType] = useState<DiscrepancyType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DiscrepancyStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list');
  const [drilldownFilter, setDrilldownFilter] = useState<{ field: string; value: string } | null>(null);

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (searchText && !d.description.toLowerCase().includes(searchText.toLowerCase()))
      return false;
    return true;
  });

  const getMatchingResult = (resultId: string) => {
    return matchingResults.find((r) => r.id === resultId);
  };

  const getTransportRecord = (type: string, id: string) => {
    switch (type) {
      case 'voyage':
        return voyageDetails.find((v) => v.id === id);
      case 'port-fee':
        return portFees.find((p) => p.id === id);
      case 'bunker-fee':
        return bunkerFees.find((b) => b.id === id);
      default:
        return null;
    }
  };

  const getBill = (id: string) => {
    return carrierBills.find((b) => b.id === id);
  };

  const getTypeInfo = (type: DiscrepancyType) => {
    return discrepancyTypes.find((t) => t.type === type);
  };

  const getStatusInfo = (status: DiscrepancyStatus) => {
    return statusOptions.find((s) => s.value === status);
  };

  const getDiscrepancyFeeType = (disc: any): string => {
    const result = matchingResults.find((r) => r.id === disc.matchingResultId);
    if (!result) return '其他';
    if (result.transportType === 'voyage') return '航次运费';
    if (result.transportType === 'port-fee') return '港杂费';
    if (result.transportType === 'bunker-fee') return '燃油附加费';
    return '其他';
  };

  const getDiscrepancyCarrier = (disc: any): string => {
    const result = matchingResults.find((r) => r.id === disc.matchingResultId);
    if (!result || !result.carrierBillId) return '未知';
    const bill = carrierBills.find((b) => b.id === result.carrierBillId);
    return bill?.carrierName || '未知';
  };

  const reviewData = (() => {
    const carrierMap = new Map<string, { count: number; amount: number; typeMap: Map<string, { count: number; amount: number }> }>();
    const feeTypeMap = new Map<string, { count: number; amount: number }>();
    const typeMap = new Map<string, { count: number; amount: number }>();

    discrepancies.forEach((disc) => {
      if (disc.status === 'resolved') return;

      const carrier = getDiscrepancyCarrier(disc);
      const feeType = getDiscrepancyFeeType(disc);
      const discType = disc.type;
      const amount = disc.diffAmount || 0;

      if (!carrierMap.has(carrier)) {
        carrierMap.set(carrier, { count: 0, amount: 0, typeMap: new Map() });
      }
      const carrierData = carrierMap.get(carrier)!;
      carrierData.count++;
      carrierData.amount += amount;
      if (!carrierData.typeMap.has(discType)) {
        carrierData.typeMap.set(discType, { count: 0, amount: 0 });
      }
      const carrierTypeData = carrierData.typeMap.get(discType)!;
      carrierTypeData.count++;
      carrierTypeData.amount += amount;

      if (!feeTypeMap.has(feeType)) {
        feeTypeMap.set(feeType, { count: 0, amount: 0 });
      }
      const feeTypeData = feeTypeMap.get(feeType)!;
      feeTypeData.count++;
      feeTypeData.amount += amount;

      if (!typeMap.has(discType)) {
        typeMap.set(discType, { count: 0, amount: 0 });
      }
      const typeData = typeMap.get(discType)!;
      typeData.count++;
      typeData.amount += amount;
    });

    const carriers = Array.from(carrierMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
        typeMap: data.typeMap,
      }))
      .sort((a, b) => b.amount - a.amount);

    const feeTypes = Array.from(feeTypeMap.entries())
      .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
      .sort((a, b) => b.amount - a.amount);

    const types = Array.from(typeMap.entries())
      .map(([type, data]) => {
        const typeInfo = getTypeInfo(type as any);
        return {
          type,
          label: typeInfo?.label || type,
          count: data.count,
          amount: data.amount,
          color: typeInfo?.color || 'slate',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const totalPending = discrepancies.filter((d) => d.status !== 'resolved').length;
    const totalAmount = discrepancies
      .filter((d) => d.status !== 'resolved')
      .reduce((sum, d) => sum + (d.diffAmount || 0), 0);

    return { carriers, feeTypes, types, totalPending, totalAmount };
  })();

  const drilldownDiscrepancies = drilldownFilter
    ? filteredDiscrepancies.filter((d) => {
        if (drilldownFilter.field === 'carrier') {
          return getDiscrepancyCarrier(d) === drilldownFilter.value;
        }
        if (drilldownFilter.field === 'feeType') {
          return getDiscrepancyFeeType(d) === drilldownFilter.value;
        }
        if (drilldownFilter.field === 'type') {
          return d.type === drilldownFilter.value;
        }
        return true;
      })
    : [];

  const handleSaveComment = (id: string) => {
    updateDiscrepancyComment(id, commentText);
    const disc = discrepancies.find((d) => d.id === id);
    addOperationLog({
      operationType: '差异处理',
      operator: '张财务',
      description: '更新处理意见',
      detail: `差异${id} - ${disc?.type ? getTypeInfo(disc.type as any)?.label : ''}: ${commentText || '清空意见'}`,
    });
    setEditingId(null);
    setCommentText('');
  };

  const handleStatusChange = (id: string, status: DiscrepancyStatus) => {
    const disc = discrepancies.find((d) => d.id === id);
    const oldStatus = disc?.status;
    const oldLabel = oldStatus ? getStatusInfo(oldStatus)?.label : '';
    const newLabel = getStatusInfo(status)?.label || '';
    const typeLabel = disc?.type ? getTypeInfo(disc.type as any)?.label : '';

    updateDiscrepancyStatus(id, status);

    if (status === 'disputed') {
      addOperationLog({
        operationType: '转争议',
        operator: '张财务',
        description: '差异转争议处理',
        detail: `差异${id}(${typeLabel})：${oldLabel} → ${newLabel}`,
      });
    } else {
      addOperationLog({
        operationType: '差异处理',
        operator: '张财务',
        description: '更新差异状态',
        detail: `差异${id}(${typeLabel})：${oldLabel} → ${newLabel}`,
      });
    }
  };

  const stats = {
    total: discrepancies.length,
    duplicate: discrepancies.filter((d) => d.type === 'duplicate').length,
    missing: discrepancies.filter((d) => d.type === 'missing').length,
    amountExceed: discrepancies.filter((d) => d.type === 'amount-exceed').length,
    currencyMismatch: discrepancies.filter((d) => d.type === 'currency-mismatch').length,
  };

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      icon: 'bg-red-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      icon: 'bg-amber-500',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      icon: 'bg-orange-500',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      icon: 'bg-purple-500',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: 'bg-slate-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      icon: 'bg-emerald-500',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">差异清单</h1>
          <p className="text-sm text-slate-500 mt-1">
            {viewMode === 'list' ? '查看和处理所有匹配差异，添加处理意见' : '按维度汇总差异，优先处理金额大的问题'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => {
              setViewMode('list');
              setDrilldownFilter(null);
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-all',
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <List className="w-4 h-4" />
            列表视图
          </button>
          <button
            onClick={() => {
              setViewMode('review');
              setDrilldownFilter(null);
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-all',
              viewMode === 'review' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            复核视图
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">总差异</p>
            </div>
          </div>
        </div>

        {discrepancyTypes.map((type) => {
          const Icon = type.icon;
          const colors = colorClasses[type.color as keyof typeof colorClasses];
          const count =
            type.type === 'duplicate'
              ? stats.duplicate
              : type.type === 'missing'
              ? stats.missing
              : type.type === 'amount-exceed'
              ? stats.amountExceed
              : stats.currencyMismatch;

          return (
            <button
              key={type.type}
              onClick={() => setFilterType(filterType === type.type ? 'all' : type.type)}
              className={cn(
                'bg-white rounded-xl p-4 border shadow-sm text-left transition-all',
                filterType === type.type ? colors.border : 'border-slate-100',
                filterType === type.type ? 'ring-2 ' + colors.bg : '',
                'hover:shadow-md'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.icon)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className={cn('text-xs', colors.text)}>{type.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* List View: Filters */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">筛选：</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">状态</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="all">全部状态</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 max-w-xs ml-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索差异描述..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View: Discrepancy List */}
      {viewMode === 'list' && (
        <>{filteredDiscrepancies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">暂无差异</h3>
          <p className="text-slate-400">所有记录都已成功匹配，没有发现差异</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDiscrepancies.map((disc) => {
            const typeInfo = getTypeInfo(disc.type);
            const statusInfo = getStatusInfo(disc.status);
            const TypeIcon = typeInfo?.icon || AlertTriangle;
            const StatusIcon = statusInfo?.icon || Clock;
            const typeColors = colorClasses[typeInfo?.color || 'slate' as keyof typeof colorClasses];
            const statusColors = colorClasses[statusInfo?.color || 'slate' as keyof typeof colorClasses];
            const isExpanded = expandedId === disc.id;
            const matchingResult = getMatchingResult(disc.matchingResultId);
            const transport = matchingResult
              ? getTransportRecord(matchingResult.transportType, matchingResult.transportRecordId)
              : null;
            const bill = matchingResult ? getBill(matchingResult.carrierBillId) : null;

            return (
              <div
                key={disc.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        typeColors.icon
                      )}
                    >
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', typeColors.bg, typeColors.text)}>
                          {typeInfo?.label}
                        </span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusColors.bg, statusColors.text)}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusInfo?.label}
                        </span>
                        {matchingResult?.manualAdjusted && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-600">
                            手动调整
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 truncate">{disc.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {disc.diffAmount > 0 && (
                        <p className="text-lg font-bold text-red-500">
                          +{disc.diffAmount.toLocaleString()}
                        </p>
                      )}
                      {disc.diffPercent > 0 && (
                        <p className="text-xs text-slate-400">差异 {disc.diffPercent.toFixed(2)}%</p>
                      )}
                    </div>

                    <button className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Transport Record */}
                      {transport && (
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">运输记录</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">类型</span>
                              <span className="text-slate-700">
                                {matchingResult?.transportType === 'voyage'
                                  ? '航次运费'
                                  : matchingResult?.transportType === 'port-fee'
                                  ? '港杂费'
                                  : '燃油附加费'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">船名/航次</span>
                              <span className="text-slate-700">
                                {(transport as any).vesselName} {(transport as any).voyageNumber}
                              </span>
                            </div>
                            {matchingResult?.transportType === 'voyage' && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">运费</span>
                                <span className="text-slate-700 font-medium">
                                  {(transport as any).currency}{' '}
                                  {(transport as any).freightAmount?.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {(matchingResult?.transportType === 'port-fee' ||
                              matchingResult?.transportType === 'bunker-fee') && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">金额</span>
                                <span className="text-slate-700 font-medium">
                                  {(transport as any).currency}{' '}
                                  {(transport as any).amount?.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Carrier Bill */}
                      {bill && (
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">承运商账单</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">账单号</span>
                              <span className="text-slate-700">{bill.billNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">承运商</span>
                              <span className="text-slate-700">{bill.carrierName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">金额</span>
                              <span className="text-slate-700 font-medium">
                                {bill.currency} {bill.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Change */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        状态处理
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status) => {
                          const SIcon = status.icon;
                          const sColors = colorClasses[status.color as keyof typeof colorClasses];
                          return (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(disc.id, status.value)}
                              className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
                                disc.status === status.value
                                  ? sColors.icon + ' text-white'
                                  : sColors.bg + ' ' + sColors.text + ' hover:opacity-80'
                              )}
                            >
                              <SIcon className="w-4 h-4" />
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        处理意见
                      </label>
                      {editingId === disc.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="请输入处理意见..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setCommentText('');
                              }}
                              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveComment(disc.id)}
                              className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingId(disc.id);
                            setCommentText(disc.comment);
                          }}
                          className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          {disc.comment ? (
                            <p className="text-sm text-slate-700">{disc.comment}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">点击添加处理意见...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}</>
      )}

      {/* Review View */}
      {viewMode === 'review' && (
        <div className="space-y-6">
          {drilldownFilter ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
              <button
                onClick={() => setDrilldownFilter(null)}
                className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
                返回汇总视图
              </button>
              <span className="text-sm text-slate-500">
                当前筛选：{drilldownFilter.field === 'carrier' ? '承运商' : drilldownFilter.field === 'feeType' ? '费用类型' : '差异类型'} = {drilldownFilter.value}
              </span>
            </div>

            {drilldownDiscrepancies.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">暂无差异</h3>
                <p className="text-slate-400">该分类下没有待处理的差异</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drilldownDiscrepancies.map((disc) => {
                  const typeInfo = getTypeInfo(disc.type);
                  const statusInfo = getStatusInfo(disc.status);
                  const TypeIcon = typeInfo?.icon || AlertTriangle;
                  const StatusIcon = statusInfo?.icon || Clock;
                  const typeColors = colorClasses[typeInfo?.color || 'slate' as keyof typeof colorClasses];
                  const statusColors = colorClasses[statusInfo?.color || 'slate' as keyof typeof colorClasses];
                  const isExpanded = expandedId === disc.id;
                  const matchingResult = getMatchingResult(disc.matchingResultId);
                  const transport = matchingResult
                    ? getTransportRecord(matchingResult.transportType, matchingResult.transportRecordId)
                    : null;
                  const bill = matchingResult ? getBill(matchingResult.carrierBillId) : null;

                  return (
                    <div
                      key={disc.id}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                              typeColors.icon
                            )}
                          >
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', typeColors.bg, typeColors.text)}>
                                {typeInfo?.label}
                              </span>
                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusColors.bg, statusColors.text)}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {statusInfo?.label}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 truncate">{disc.description}</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {disc.diffAmount > 0 && (
                              <p className="text-lg font-bold text-red-500">
                                +{disc.diffAmount.toLocaleString()}
                              </p>
                            )}
                            {disc.diffPercent > 0 && (
                              <p className="text-xs text-slate-400">差异 {disc.diffPercent.toFixed(2)}%</p>
                            )}
                          </div>

                          <button className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {transport && (
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">运输记录</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">类型</span>
                                    <span className="text-slate-700">
                                      {matchingResult?.transportType === 'voyage'
                                        ? '航次运费'
                                        : matchingResult?.transportType === 'port-fee'
                                        ? '港杂费'
                                        : '燃油附加费'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">船名/航次</span>
                                    <span className="text-slate-700">
                                      {(transport as any).vesselName} {(transport as any).voyageNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bill && (
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">承运商账单</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">账单号</span>
                                    <span className="text-slate-700">{bill.billNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">承运商</span>
                                    <span className="text-slate-700">{bill.carrierName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">金额</span>
                                    <span className="text-slate-700 font-medium">
                                      {bill.currency} {bill.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mb-4">
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                              状态处理
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {statusOptions.map((status) => {
                                const SIcon = status.icon;
                                const sColors = colorClasses[status.color as keyof typeof colorClasses];
                                return (
                                  <button
                                    key={status.value}
                                    onClick={() => handleStatusChange(disc.id, status.value)}
                                    className={cn(
                                      'px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all',
                                      disc.status === status.value
                                        ? sColors.icon + ' text-white'
                                        : sColors.bg + ' ' + sColors.text + ' hover:opacity-80'
                                    )}
                                  >
                                    <SIcon className="w-4 h-4" />
                                    {status.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              处理意见
                            </label>
                            {editingId === disc.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="请输入处理意见..."
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setCommentText('');
                                    }}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveComment(disc.id)}
                                    className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                                  >
                                    保存
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingId(disc.id);
                                  setCommentText(disc.comment);
                                }}
                                className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                {disc.comment ? (
                                  <p className="text-sm text-slate-700">{disc.comment}</p>
                                ) : (
                                  <p className="text-sm text-slate-400 italic">点击添加处理意见...</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">待处理差异总金额</p>
                  <p className="text-3xl font-bold mt-1">¥{reviewData.totalAmount.toLocaleString()}</p>
                  <p className="text-white/70 text-sm mt-1">共 {reviewData.totalPending} 条待处理差异</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-semibold text-slate-800">按承运商汇总</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {reviewData.carriers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">暂无数据</div>
                  ) : (
                    reviewData.carriers.map((carrier) => (
                      <button
                        key={carrier.name}
                        onClick={() => setDrilldownFilter({ field: 'carrier', value: carrier.name })}
                        className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{carrier.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{carrier.count} 条差异</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-red-500">+{carrier.amount.toLocaleString()}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-800">按费用类型汇总</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {reviewData.feeTypes.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">暂无数据</div>
                  ) : (
                    reviewData.feeTypes.map((feeType) => (
                      <button
                        key={feeType.name}
                        onClick={() => setDrilldownFilter({ field: 'feeType', value: feeType.name })}
                        className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{feeType.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{feeType.count} 条差异</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-red-500">+{feeType.amount.toLocaleString()}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-800">按差异类型汇总</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {reviewData.types.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">暂无数据</div>
                  ) : (
                    reviewData.types.map((type) => {
                      const colors = colorClasses[type.color as keyof typeof colorClasses];
                      return (
                        <button
                          key={type.type}
                          onClick={() => setDrilldownFilter({ field: 'type', value: type.type })}
                          className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.icon)}>
                              {(() => {
                                const t = discrepancyTypes.find((dt) => dt.type === type.type);
                                const Icon = t?.icon || AlertTriangle;
                                return <Icon className="w-4 h-4 text-white" />;
                              })()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{type.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{type.count} 条差异</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-red-500">+{type.amount.toLocaleString()}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
