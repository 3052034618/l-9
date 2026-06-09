import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  GitCompare,
  AlertTriangle,
  CheckSquare,
  FileText,
  Menu,
  X,
  Ship,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/import', label: '文件导入', icon: FileUp },
  { path: '/matching', label: '匹配规则', icon: GitCompare },
  { path: '/discrepancy', label: '差异清单', icon: AlertTriangle },
  { path: '/export', label: '确认导出', icon: CheckSquare },
  { path: '/logs', label: '操作日志', icon: FileText },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        )}
      >
        <div className={cn('flex flex-col h-full', !sidebarOpen && 'lg:items-center')}>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Ship className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold whitespace-nowrap">水运对账系统</h1>
                  <p className="text-xs text-slate-400 whitespace-nowrap">Freight Audit System</p>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    !sidebarOpen && 'lg:justify-center lg:px-2'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-cyan-400')} />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User */}
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">张</span>
                </div>
                <div>
                  <p className="text-sm font-medium">张财务</p>
                  <p className="text-xs text-slate-400">财务专员</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find((n) => n.path === location.pathname)?.label || '工作台'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
