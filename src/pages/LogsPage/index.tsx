import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Clock,
  Upload,
  GitCompare,
  CheckSquare,
  Download,
  Settings,
  FileUp,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '@/lib/utils';

const operationTypes = [
  { type: 'all', label: '全部类型', icon: FileText },
  { type: '文件导入', label: '文件导入', icon: Upload },
  { type: '自动匹配', label: '自动匹配', icon: GitCompare },
  { type: '手动匹配', label: '手动匹配', icon: Settings },
  { type: '合并匹配', label: '合并匹配', icon: CheckSquare },
  { type: '拆分匹配', label: '拆分匹配', icon: Settings },
  { type: '批量确认', label: '批量确认', icon: CheckSquare },
  { type: '单条确认', label: '单条确认', icon: CheckSquare },
  { type: '导出', label: '导出', icon: Download },
];

export default function LogsPage() {
  const { operationLogs } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredLogs = operationLogs.filter((log) => {
    if (filterType !== 'all' && log.operationType !== filterType) return false;
    if (searchText) {
      const lower = searchText.toLowerCase();
      if (
        !log.description.toLowerCase().includes(lower) &&
        !log.detail.toLowerCase().includes(lower) &&
        !log.operator.toLowerCase().includes(lower)
      )
        return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '文件导入':
        return FileUp;
      case '自动匹配':
      case '手动匹配':
      case '合并匹配':
      case '拆分匹配':
        return GitCompare;
      case '批量确认':
      case '单条确认':
        return CheckSquare;
      case '导出':
        return Download;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '文件导入':
        return 'blue';
      case '自动匹配':
        return 'emerald';
      case '手动匹配':
      case '合并匹配':
      case '拆分匹配':
        return 'purple';
      case '批量确认':
      case '单条确认':
        return 'amber';
      case '导出':
        return 'cyan';
      default:
        return 'slate';
    }
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: 'bg-emerald-500',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'bg-purple-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: 'bg-amber-500',
    },
    cyan: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      icon: 'bg-cyan-500',
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
          <h1 className="text-xl font-bold text-slate-800">操作日志</h1>
          <p className="text-sm text-slate-500 mt-1">查看所有系统操作记录</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{operationLogs.length}</p>
              <p className="text-xs text-slate-500">总操作数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {operationLogs.filter((l) => l.operationType === '文件导入').length}
              </p>
              <p className="text-xs text-slate-500">导入操作</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {
                  operationLogs.filter((l) =>
                    ['自动匹配', '手动匹配', '合并匹配', '拆分匹配'].includes(l.operationType)
                  ).length
                }
              </p>
              <p className="text-xs text-slate-500">匹配操作</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {operationLogs.filter((l) => l.operationType.includes('确认')).length}
              </p>
              <p className="text-xs text-slate-500">确认操作</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">操作类型：</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {operationTypes.map((type) => {
              const Icon = type.icon;
              const isActive = filterType === type.type;
              return (
                <button
                  key={type.type}
                  onClick={() => {
                    setFilterType(type.type);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all',
                    isActive
                      ? 'bg-cyan-100 text-cyan-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索操作描述..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {paginatedLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无操作日志</p>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const Icon = getTypeIcon(log.operationType);
              const color = getTypeColor(log.operationType);
              const colors = colorClasses[color as keyof typeof colorClasses];

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        colors.icon
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={cn('text-sm font-medium text-slate-800')}>
                          {log.description}
                        </span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', colors.bg, colors.text)}>
                          {log.operationType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{log.detail}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <User className="w-4 h-4" />
                        <span>{log.operator}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              共 {filteredLogs.length} 条记录，第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
