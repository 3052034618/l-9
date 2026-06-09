import { useState } from 'react';
import {
  Settings,
  Play,
  CheckCircle2,
  XCircle,
  GitCompare,
  Clock,
  DollarSign,
  Globe,
  Ship,
  Hash,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
  Merge,
  Scissors,
  Hand,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '@/lib/utils';

export default function MatchingPage() {
  const {
    matchingRules,
    setMatchingRules,
    matchingResults,
    runMatching,
    isMatching,
    matchingProgress,
    carrierBills,
    voyageDetails,
    portFees,
    bunkerFees,
    mergeMatchingResults,
    splitMatchingResult,
    manualMatch,
  } = useAppStore();

  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'results'>('rules');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showManualMatch, setShowManualMatch] = useState(false);

  const handleRuleChange = (key: keyof typeof matchingRules, value: any) => {
    setMatchingRules({
      ...matchingRules,
      [key]: value,
    });
  };

  const handleRunMatching = () => {
    runMatching();
    setActiveTab('results');
  };

  const toggleResult = (id: string) => {
    setExpandedResult(expandedResult === id ? null : id);
  };

  const toggleSelectResult = (id: string) => {
    setSelectedResults((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleMerge = () => {
    if (selectedResults.length >= 2) {
      mergeMatchingResults(selectedResults);
      setSelectedResults([]);
    }
  };

  const handleSplit = (id: string) => {
    splitMatchingResult(id);
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

  const getCarrierBill = (id: string) => {
    return carrierBills.find((b) => b.id === id);
  };

  const matchedCount = matchingResults.filter((r) => r.status === 'matched').length;
  const discrepancyCount = matchingResults.filter((r) => r.status === 'discrepancy').length;
  const pendingCount = matchingResults.filter((r) => r.status === 'pending').length;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'voyage':
        return '航次运费';
      case 'port-fee':
        return '港杂费';
      case 'bunker-fee':
        return '燃油附加费';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">匹配规则</h1>
          <p className="text-sm text-slate-500 mt-1">
            配置匹配规则，执行自动匹配，查看和调整匹配结果
          </p>
        </div>
        <button
          onClick={handleRunMatching}
          disabled={isMatching}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/25"
        >
          {isMatching ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              匹配中 {matchingProgress}%
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              执行匹配
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'rules'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          规则配置
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'results'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <GitCompare className="w-4 h-4 inline mr-2" />
          匹配结果
          {matchingResults.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded-full">
              {matchingResults.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matching Rules */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-500" />
                匹配字段设置
              </h3>
            </div>
            <div className="p-6 space-y-5">
              {/* Vessel Name */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Ship className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">船名匹配</p>
                    <p className="text-sm text-slate-500">按船舶名称精确匹配</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchingRules.vesselNameEnabled}
                    onChange={(e) => handleRuleChange('vesselNameEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Voyage Number */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">航次号匹配</p>
                    <p className="text-sm text-slate-500">按航次编号精确匹配</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchingRules.voyageNumberEnabled}
                    onChange={(e) => handleRuleChange('voyageNumberEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Ports */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">装卸港匹配</p>
                    <p className="text-sm text-slate-500">按装货港和卸货港匹配</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchingRules.portsEnabled}
                    onChange={(e) => handleRuleChange('portsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Date */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">日期匹配</p>
                      <p className="text-sm text-slate-500">按日期范围匹配</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={matchingRules.dateEnabled}
                      onChange={(e) => handleRuleChange('dateEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
                {matchingRules.dateEnabled && (
                  <div className="pl-13">
                    <label className="text-sm text-slate-600 block mb-2">
                      日期容差：{matchingRules.dateToleranceDays} 天
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={matchingRules.dateToleranceDays}
                      onChange={(e) =>
                        handleRuleChange('dateToleranceDays', Number(e.target.value))
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1天</span>
                      <span>15天</span>
                      <span>30天</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">金额校验</p>
                      <p className="text-sm text-slate-500">校验金额差异是否在容差范围内</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={matchingRules.amountEnabled}
                      onChange={(e) => handleRuleChange('amountEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
                {matchingRules.amountEnabled && (
                  <div className="pl-13">
                    <label className="text-sm text-slate-600 block mb-2">
                      金额容差：{matchingRules.amountTolerancePercent}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={matchingRules.amountTolerancePercent}
                      onChange={(e) =>
                        handleRuleChange('amountTolerancePercent', Number(e.target.value))
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1%</span>
                      <span>10%</span>
                      <span>20%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">币种校验</p>
                    <p className="text-sm text-slate-500">检查币种是否一致</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchingRules.currencyCheck}
                    onChange={(e) => handleRuleChange('currencyCheck', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Fee Type */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">费用类型匹配</p>
                    <p className="text-sm text-slate-500">不同费用类型不互配（运费/港杂费/燃油费）</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchingRules.feeTypeCheck}
                    onChange={(e) => handleRuleChange('feeTypeCheck', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Match Preview / Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">匹配统计</h3>
              </div>
              <div className="p-6">
                {matchingResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>尚未执行匹配</p>
                    <p className="text-sm mt-1">点击「执行匹配」按钮开始</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-600">{matchedCount}</p>
                      <p className="text-xs text-emerald-600/70">匹配成功</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-amber-600">{discrepancyCount}</p>
                      <p className="text-xs text-amber-600/70">有差异</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <XCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-600">{pendingCount}</p>
                      <p className="text-xs text-slate-500">未匹配</p>
                    </div>
                  </div>
                )}

                {isMatching && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">匹配进度</span>
                      <span className="text-sm font-medium text-cyan-600">{matchingProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${matchingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
              <h4 className="font-semibold text-cyan-800 mb-3">匹配规则说明</h4>
              <ul className="space-y-2 text-sm text-cyan-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  系统会按照启用的字段逐一进行匹配
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  日期和金额可设置容差范围，提高匹配成功率
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  匹配后可手动调整，支持合并和拆分匹配结果
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Batch Actions */}
          {selectedResults.length > 0 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-cyan-700">
                已选择 <span className="font-semibold">{selectedResults.length}</span> 条记录
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMerge}
                  disabled={selectedResults.length < 2}
                  className="px-4 py-2 bg-white border border-cyan-300 text-cyan-700 text-sm font-medium rounded-lg hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Merge className="w-4 h-4" />
                  合并
                </button>
                <button
                  onClick={() => setShowManualMatch(true)}
                  className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                >
                  <Hand className="w-4 h-4" />
                  手动匹配
                </button>
              </div>
            </div>
          )}

          {/* Results List */}
          {matchingResults.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
              <GitCompare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">暂无匹配结果</h3>
              <p className="text-slate-400 mb-6">请先导入数据并执行自动匹配</p>
              <button
                onClick={handleRunMatching}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                执行匹配
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matchingResults.map((result) => {
                const transport = getTransportRecord(result.transportType, result.transportRecordId);
                const bill = getCarrierBill(result.carrierBillId);
                const isExpanded = expandedResult === result.id;
                const isSelected = selectedResults.includes(result.id);

                return (
                  <div
                    key={result.id}
                    className={cn(
                      'bg-white rounded-xl border transition-all',
                      isSelected ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-100',
                      'shadow-sm hover:shadow-md'
                    )}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleResult(result.id)}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectResult(result.id);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={cn(
                                'px-2.5 py-1 text-xs font-medium rounded-full',
                                result.status === 'matched'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : result.status === 'discrepancy'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {result.status === 'matched'
                                ? '匹配成功'
                                : result.status === 'discrepancy'
                                ? '存在差异'
                                : '待处理'}
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                              {getTypeLabel(result.transportType)}
                            </span>
                            {result.manualAdjusted && (
                              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-600">
                                已手动调整
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400 text-xs mb-1">运输记录</p>
                              <p className="font-medium text-slate-700 truncate">
                                {transport?.vesselName || '-'} {transport?.voyageNumber || ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">承运商账单</p>
                              <p className="font-medium text-slate-700 truncate">
                                {bill?.billNumber || '未匹配'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-xs mb-1">匹配度</p>
                              <p
                                className={cn(
                                  'font-bold',
                                  result.matchScore >= 80
                                    ? 'text-emerald-600'
                                    : result.matchScore >= 60
                                    ? 'text-amber-600'
                                    : 'text-red-500'
                                )}
                              >
                                {result.matchScore}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {result.carrierBillId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSplit(result.id);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                              title="拆分匹配"
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Transport Record Details */}
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                              运输记录详情
                            </h4>
                            <div className="space-y-2 text-sm">
                              {result.transportType === 'voyage' && transport && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">船名</span>
                                    <span className="text-slate-700">
                                      {(transport as any).vesselName}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">航次号</span>
                                    <span className="text-slate-700">
                                      {(transport as any).voyageNumber}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">装卸港</span>
                                    <span className="text-slate-700">
                                      {(transport as any).loadingPort} →{' '}
                                      {(transport as any).dischargePort}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">运费</span>
                                    <span className="text-slate-700 font-medium">
                                      {(transport as any).currency}{' '}
                                      {(transport as any).freightAmount?.toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              )}
                              {result.transportType === 'port-fee' && transport && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">港口</span>
                                    <span className="text-slate-700">
                                      {(transport as any).port}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">费用类型</span>
                                    <span className="text-slate-700">
                                      {(transport as any).feeType}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">金额</span>
                                    <span className="text-slate-700 font-medium">
                                      {(transport as any).currency}{' '}
                                      {(transport as any).amount?.toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              )}
                              {result.transportType === 'bunker-fee' && transport && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">燃油类型</span>
                                    <span className="text-slate-700">
                                      {(transport as any).bunkerType}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">数量</span>
                                    <span className="text-slate-700">
                                      {(transport as any).fuelQuantity} 吨
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">金额</span>
                                    <span className="text-slate-700 font-medium">
                                      {(transport as any).currency}{' '}
                                      {(transport as any).amount?.toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Carrier Bill Details */}
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                              承运商账单详情
                            </h4>
                            {bill ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">账单号</span>
                                  <span className="text-slate-700">{bill.billNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">承运商</span>
                                  <span className="text-slate-700">{bill.carrierName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">费用类型</span>
                                  <span className="text-slate-700">{bill.feeType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">总金额</span>
                                  <span className="text-slate-700 font-medium">
                                    {bill.currency} {bill.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">未匹配到账单</p>
                            )}
                          </div>
                        </div>

                        {/* Discrepancies */}
                        {result.discrepancies.length > 0 && (
                          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <h4 className="text-sm font-semibold text-amber-800 mb-3">
                              差异项 ({result.discrepancies.length})
                            </h4>
                            <div className="space-y-2">
                              {result.discrepancies.map((disc) => (
                                <div
                                  key={disc.id}
                                  className="flex items-start justify-between p-3 bg-white/60 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-amber-800">
                                      {disc.type === 'duplicate' && '重复收费'}
                                      {disc.type === 'missing' && '漏收费用'}
                                      {disc.type === 'amount-exceed' && '金额超限'}
                                      {disc.type === 'currency-mismatch' && '币种不一致'}
                                    </p>
                                    <p className="text-xs text-amber-600/70 mt-1">
                                      {disc.description}
                                    </p>
                                  </div>
                                  {disc.diffAmount > 0 && (
                                    <span className="text-sm font-bold text-amber-600">
                                      +{disc.diffAmount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
