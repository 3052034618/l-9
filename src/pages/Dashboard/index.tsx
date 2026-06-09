import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import { useAppStore } from '../../store/useAppStore';
import { useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getStats, operationLogs, runMatching, carrierBills } = useAppStore();
  const stats = getStats();

  useEffect(() => {
    if (carrierBills.length > 0) {
      runMatching();
    }
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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
