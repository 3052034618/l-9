import { useState, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Download,
  Plus,
  Ship,
  Anchor,
  Fuel,
  Receipt,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { FileType, VoyageDetail, PortFee, BunkerFee, CarrierBill } from '../../types';
import { cn } from '@/lib/utils';

interface FileImportSection {
  type: FileType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const importSections: FileImportSection[] = [
  {
    type: 'voyage',
    title: '航次明细',
    description: '包含船名、航次号、装卸港、运费等信息',
    icon: Ship,
    color: 'blue',
  },
  {
    type: 'port-fee',
    title: '港杂费',
    description: '包含港口费用、装卸费、港务费等',
    icon: Anchor,
    color: 'emerald',
  },
  {
    type: 'bunker-fee',
    title: '燃油附加费',
    description: '包含燃油数量、单价、总金额等',
    icon: Fuel,
    color: 'amber',
  },
  {
    type: 'carrier-bill',
    title: '承运商账单',
    description: '包含账单号、承运商、总金额等',
    icon: Receipt,
    color: 'purple',
  },
];

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    hover: 'hover:border-blue-400',
    iconBg: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    hover: 'hover:border-emerald-400',
    iconBg: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    hover: 'hover:border-amber-400',
    iconBg: 'bg-amber-500',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-600',
    hover: 'hover:border-purple-400',
    iconBg: 'bg-purple-500',
  },
};

export default function ImportPage() {
  const {
    voyageDetails,
    portFees,
    bunkerFees,
    carrierBills,
    setVoyageDetails,
    setPortFees,
    setBunkerFees,
    setCarrierBills,
    addUploadedFile,
    addOperationLog,
  } = useAppStore();

  const [dragOver, setDragOver] = useState<FileType | null>(null);
  const [previewData, setPreviewData] = useState<{ type: FileType; data: any[]; totalCount: number } | null>(null);
  const [fullData, setFullData] = useState<{ type: FileType; data: any[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleFileUpload = useCallback(
    (file: File, type: FileType) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        alert('请上传 Excel 或 CSV 文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        setFullData({ type, data: jsonData });
        setPreviewData({ type, data: jsonData.slice(0, 10), totalCount: jsonData.length });
      };
      reader.readAsBinaryString(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: FileType) => {
      e.preventDefault();
      setDragOver(null);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0], type);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent, type: FileType) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const confirmImport = () => {
    if (!fullData) return;

    setImporting(true);

    setTimeout(() => {
      const { type, data } = fullData;

      switch (type) {
        case 'voyage': {
          const voyages: VoyageDetail[] = data.map((item: any) => ({
            id: generateId(),
            vesselName: item['船名'] || item['vesselName'] || '',
            voyageNumber: item['航次号'] || item['voyageNumber'] || '',
            loadingPort: item['装货港'] || item['loadingPort'] || '',
            dischargePort: item['卸货港'] || item['dischargePort'] || '',
            sailingDate: item['开航日期'] || item['sailingDate'] || '',
            arrivalDate: item['到港日期'] || item['arrivalDate'] || '',
            cargoQuantity: Number(item['货量'] || item['cargoQuantity'] || 0),
            cargoType: item['货种'] || item['cargoType'] || '',
            currency: item['币种'] || item['currency'] || 'USD',
            freightAmount: Number(item['运费'] || item['freightAmount'] || 0),
            createdAt: new Date().toISOString(),
          }));
          setVoyageDetails([...voyageDetails, ...voyages]);
          break;
        }
        case 'port-fee': {
          const fees: PortFee[] = data.map((item: any) => ({
            id: generateId(),
            vesselName: item['船名'] || item['vesselName'] || '',
            voyageNumber: item['航次号'] || item['voyageNumber'] || '',
            port: item['港口'] || item['port'] || '',
            feeDate: item['费用日期'] || item['feeDate'] || '',
            feeType: item['费用类型'] || item['feeType'] || '',
            amount: Number(item['金额'] || item['amount'] || 0),
            currency: item['币种'] || item['currency'] || 'USD',
            remark: item['备注'] || item['remark'] || '',
          }));
          setPortFees([...portFees, ...fees]);
          break;
        }
        case 'bunker-fee': {
          const fees: BunkerFee[] = data.map((item: any) => ({
            id: generateId(),
            vesselName: item['船名'] || item['vesselName'] || '',
            voyageNumber: item['航次号'] || item['voyageNumber'] || '',
            feeDate: item['加油日期'] || item['feeDate'] || '',
            fuelQuantity: Number(item['燃油数量'] || item['fuelQuantity'] || 0),
            unitPrice: Number(item['单价'] || item['unitPrice'] || 0),
            amount: Number(item['总金额'] || item['amount'] || 0),
            currency: item['币种'] || item['currency'] || 'USD',
            bunkerType: item['燃油类型'] || item['bunkerType'] || '',
          }));
          setBunkerFees([...bunkerFees, ...fees]);
          break;
        }
        case 'carrier-bill': {
          const bills: CarrierBill[] = data.map((item: any) => ({
            id: generateId(),
            billNumber: item['账单号'] || item['billNumber'] || '',
            carrierName: item['承运商'] || item['carrierName'] || '',
            vesselName: item['船名'] || item['vesselName'] || '',
            voyageNumber: item['航次号'] || item['voyageNumber'] || '',
            billDate: item['账单日期'] || item['billDate'] || '',
            currency: item['币种'] || item['currency'] || 'USD',
            totalAmount: Number(item['总金额'] || item['totalAmount'] || 0),
            feeType: item['费用类型'] || item['feeType'] || '',
            loadingPort: item['装货港'] || item['loadingPort'] || '',
            dischargePort: item['卸货港'] || item['dischargePort'] || '',
            status: 'pending' as const,
          }));
          setCarrierBills([...carrierBills, ...bills]);
          break;
        }
      }

      addUploadedFile({
        id: generateId(),
        name: `import_${type}_${Date.now()}.xlsx`,
        type,
        size: 1024 * 100,
        uploadedAt: new Date().toISOString(),
        recordCount: data.length,
      });

      addOperationLog({
        operationType: '文件导入',
        operator: '张财务',
        description: `导入${importSections.find((s) => s.type === type)?.title}文件`,
        detail: `成功导入${data.length}条记录`,
      });

      setPreviewData(null);
      setFullData(null);
      setImporting(false);
    }, 800);
  };

  const getRecordCount = (type: FileType) => {
    switch (type) {
      case 'voyage':
        return voyageDetails.length;
      case 'port-fee':
        return portFees.length;
      case 'bunker-fee':
        return bunkerFees.length;
      case 'carrier-bill':
        return carrierBills.length;
    }
  };

  const downloadTemplate = (type: FileType) => {
    const templates: Record<FileType, any[]> = {
      'voyage': [
        {
          船名: '远洋一号',
          航次号: 'V2024-001',
          装货港: '上海',
          卸货港: '新加坡',
          开航日期: '2024-01-15',
          到港日期: '2024-01-20',
          货量: 12000,
          货种: '集装箱',
          币种: 'USD',
          运费: 85000,
        },
      ],
      'port-fee': [
        {
          船名: '远洋一号',
          航次号: 'V2024-001',
          港口: '上海',
          费用日期: '2024-01-15',
          费用类型: '港务费',
          金额: 5000,
          币种: 'USD',
          备注: '装货港港务费',
        },
      ],
      'bunker-fee': [
        {
          船名: '远洋一号',
          航次号: 'V2024-001',
          加油日期: '2024-01-14',
          燃油类型: '重油',
          燃油数量: 500,
          单价: 650,
          总金额: 325000,
          币种: 'USD',
        },
      ],
      'carrier-bill': [
        {
          账单号: 'CBR-2024-0001',
          承运商: '中远海运',
          船名: '远洋一号',
          航次号: 'V2024-001',
          账单日期: '2024-01-25',
          费用类型: '运费',
          装货港: '上海',
          卸货港: '新加坡',
          币种: 'USD',
          总金额: 85000,
        },
      ],
    };

    const ws = XLSX.utils.json_to_sheet(templates[type]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${importSections.find((s) => s.type === type)?.title}_模板.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">文件导入</h1>
          <p className="text-sm text-slate-500 mt-1">
            导入运输记录和承运商账单数据，支持 Excel 和 CSV 格式
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {importSections.map((section) => {
          const Icon = section.icon;
          const colors = colorMap[section.color as keyof typeof colorMap];
          const recordCount = getRecordCount(section.type);
          const isDragOver = dragOver === section.type;

          return (
            <div
              key={section.type}
              className={cn(
                'bg-white rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden',
                isDragOver ? colors.border : 'border-slate-200',
                isDragOver ? colors.bg : '',
                'hover:shadow-lg'
              )}
              onDrop={(e) => handleDrop(e, section.type)}
              onDragOver={(e) => handleDragOver(e, section.type)}
              onDragLeave={handleDragLeave}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
                        colors.iconBg
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{section.title}</h3>
                      <p className="text-sm text-slate-500">{section.description}</p>
                    </div>
                  </div>
                  {recordCount > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-full">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600">
                        {recordCount} 条
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                    isDragOver ? colors.border : 'border-slate-200',
                    isDragOver ? 'bg-white/80' : 'bg-slate-50/50 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileInput(e, section.type)}
                    className="hidden"
                    id={`file-input-${section.type}`}
                  />
                  <label
                    htmlFor={`file-input-${section.type}`}
                    className="cursor-pointer block"
                  >
                    <Upload
                      className={cn(
                        'w-10 h-10 mx-auto mb-3',
                        isDragOver ? colors.text : 'text-slate-400'
                      )}
                    />
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      拖拽文件到此处，或
                      <span className={cn('ml-1', colors.text)}>点击上传</span>
                    </p>
                    <p className="text-xs text-slate-400">支持 .xlsx, .xls, .csv 格式</p>
                  </label>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => downloadTemplate(section.type)}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    下载模板
                  </button>
                  <button
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    onClick={() => {
                      const mockData = {
                        'voyage': [
                          { 船名: '示例船', 航次号: 'V001', 装货港: '上海', 卸货港: '新加坡', 开航日期: '2024-01-01', 到港日期: '2024-01-05', 货量: 1000, 货种: '集装箱', 币种: 'USD', 运费: 50000 },
                        ],
                        'port-fee': [
                          { 船名: '示例船', 航次号: 'V001', 港口: '上海', 费用日期: '2024-01-01', 费用类型: '港务费', 金额: 3000, 币种: 'USD', 备注: '测试' },
                        ],
                        'bunker-fee': [
                          { 船名: '示例船', 航次号: 'V001', 加油日期: '2024-01-01', 燃油类型: '重油', 燃油数量: 100, 单价: 600, 总金额: 60000, 币种: 'USD' },
                        ],
                        'carrier-bill': [
                          { 账单号: 'BILL001', 承运商: '示例承运商', 船名: '示例船', 航次号: 'V001', 账单日期: '2024-01-10', 费用类型: '运费', 装货港: '上海', 卸货港: '新加坡', 币种: 'USD', 总金额: 50000 },
                        ],
                      };
                      const data = mockData[section.type];
                      setFullData({ type: section.type, data });
                      setPreviewData({ type: section.type, data: data.slice(0, 10), totalCount: data.length });
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    加载示例
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">数据预览</h3>
                <p className="text-sm text-slate-500">
                  {importSections.find((s) => s.type === previewData.type)?.title} - 共{' '}
                  {previewData.totalCount} 条记录（显示前10条预览）
                </p>
              </div>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setFullData(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {previewData.data.length > 0 &&
                        Object.keys(previewData.data[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="w-4 h-4" />
                <span>请确认数据格式正确后再导入</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPreviewData(null);
                    setFullData(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={confirmImport}
                  disabled={importing}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      确认导入
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
