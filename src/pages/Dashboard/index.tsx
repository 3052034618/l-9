import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileUp,
  GitCompare,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Layers,
  Calendar,
} from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    getStats,
    operationLogs,
    runMatching,
    carrierBills,
    batches,
    currentBatchId,
    getCurrentBatch,
    createBatch,
    switchBatch,
    deleteBatch,
  } = useAppStore();
  const stats = getStats();
  const currentBatch = getCurrentBatch();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchRemark, setNewBatchRemark] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carrierBills.length > 0) {
      runMatching();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const quickActions = [
    {
      title: '导入文件',
      description: '上传运输记录和账单',
      icon: FileUp,
      path: '/import',
      color: 'blue',
    },
    {
      title: '自动匹配',
      description: '执行智能匹配算法',
      icon: GitCompare,
      path: '/matching',
      color: 'green',
    },
    {
      title: '处理差异',
      description: '查看和处理差异项',
      icon: AlertTriangle,
      path: '/discrepancy',
      color: 'amber',
    },
    {
      title: '确认导出',
      description: '批量确认并导出清单',
      icon: FileText,
      path: '/export',
      color: 'purple',
    },
  ];

  const recentLogs = operationLogs.slice(0, 5);

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
      processing: { label: '处理中', color: 'bg-amber-100 text-amber-700' },
      completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
    };
    return map[status] || map.draft;
  };

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) return;
    createBatch(newBatchName.trim(), newBatchRemark.trim());
    setNewBatchName('');
    setNewBatchRemark('');
    setCreateModalOpen(false);
    setDropdownOpen(false);
  };

  const handleSwitchBatch = (batchId: string) => {
    switchBatch(batchId);
    setDropdownOpen(false);
  };

  const handleDeleteBatch = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (batches.length <= 1) {
      alert('至少保留一个批次');
      return;
    }
    if (confirm('确定要删除该批次吗？删除后数据将无法恢复。')) {
      deleteBatch(batchId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Selector */}
      <div className="flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">当前批次</p>
              <p className="text-sm font-semibold text-slate-800">
                {currentBatch?.name || '暂无批次'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-slate-400 transition-transform',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">对账批次</span>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  新建批次
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {batches.map((batch) => {
                  const statusInfo = getStatusLabel(batch.status);
                  const isCurrent = batch.id === currentBatchId;

                  return (
                    <div
                      key={batch.id}
                      onClick={() => handleSwitchBatch(batch.id)}
                      className={cn(
                        'px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors',
                        isCurrent
                          ? 'bg-cyan-50 border-l-4 border-l-cyan-500'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              isCurrent
                                ? 'bg-cyan-500'
                                : 'bg-slate-100'
                            )}
                          >
                            <Layers
                              className={cn(
                                'w-4 h-4',
                                isCurrent ? 'text-white' : 'text-slate-500'
                              )}
                            />
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-sm font-medium',
                                isCurrent ? 'text-cyan-700' : 'text-slate-800'
                              )}
                            >
                              {batch.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">
                                {new Date(batch.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  statusInfo.color
                                )}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteBatch(batch.id, e)}
                          disabled={batches.length <= 1}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            batches.length <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                          )}
                          title={batches.length <= 1 ? '至少保留一个批次' : '删除批次'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {batch.remark && (
                        <p className="text-xs text-slate-400 mt-2 ml-11">
                          {batch.remark}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Welcome */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTh2MkgyNHYtMmgxMnptLTE2IDhoMnYtMmgtMnptMTYgMGgydi0yaC0yem0tOCA0aDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">欢迎回来，张财务 👋</h1>
          <p className="text-slate-300 mb-6">今天是对账工作日，让我们开始处理承运商账单核对吧。</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/import')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <FileUp className="w-5 h-5" />
              开始导入
            </button>
            <button
              onClick={() => navigate('/matching')}
              className="px-6 py-3 bg-white/10 backdrop-blur rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
            >
              <GitCompare className="w-5 h-5" />
              执行匹配
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总账单数"
          value={stats.totalBills}
          subtitle="承运商账单总数"
          icon={FileText}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="已匹配"
          value={stats.matchedCount}
          subtitle="匹配成功的账单"
          icon={CheckCircle2}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="差异数"
          value={stats.discrepancyCount}
          subtitle="待处理差异项"
          icon={AlertTriangle}
          color="amber"
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="待确认"
          value={stats.pendingCount}
          subtitle="待确认的账单"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Amount Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">金额统计</h3>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">账单总金额</span>
              <span className="text-lg font-bold text-slate-800">
                {formatCurrency(stats.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">已匹配金额</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(stats.matchedAmount)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: stats.totalAmount > 0 ? `${(stats.matchedAmount / stats.totalAmount) * 100}%` : '0%',
                }}
              />
            </div>
            <p className="text-xs text-slate-400 text-center">
              匹配进度 {stats.totalAmount > 0 ? ((stats.matchedAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-slate-100 transition-colors">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="font-medium text-slate-800 text-sm">{action.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">最近操作</h3>
          <button
            onClick={() => navigate('/logs')}
            className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {recentLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{log.description}</p>
                    <p className="text-xs text-slate-400">{log.detail}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Batch Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">创建新批次</h3>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewBatchName('');
                  setNewBatchRemark('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  批次名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="请输入批次名称"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注
                </label>
                <textarea
                  value={newBatchRemark}
                  onChange={(e) => setNewBatchRemark(e.target.value)}
                  placeholder="请输入备注信息（可选）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewBatchName('');
                  setNewBatchRemark('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBatch}
                disabled={!newBatchName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建批次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
