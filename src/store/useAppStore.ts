import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  VoyageDetail,
  PortFee,
  BunkerFee,
  CarrierBill,
  MatchingResult,
  Discrepancy,
  OperationLog,
  MatchingRules,
  UploadedFile,
  AppStats,
  TransportType,
  ReconciliationBatch,
  DiscrepancyStatus,
} from '../types';
import {
  mockVoyageDetails,
  mockPortFees,
  mockBunkerFees,
  mockCarrierBills,
  defaultMatchingRules,
} from '../mock/data';

interface BatchData {
  voyageDetails: VoyageDetail[];
  portFees: PortFee[];
  bunkerFees: BunkerFee[];
  carrierBills: CarrierBill[];
  matchingResults: MatchingResult[];
  discrepancies: Discrepancy[];
  uploadedFiles: UploadedFile[];
}

interface AppState {
  currentBatchId: string;
  batches: ReconciliationBatch[];
  batchDataMap: Record<string, BatchData>;
  operationLogs: OperationLog[];
  matchingRules: MatchingRules;
  matchingProgress: number;
  isMatching: boolean;
  _hasHydrated: boolean;

  voyageDetails: VoyageDetail[];
  portFees: PortFee[];
  bunkerFees: BunkerFee[];
  carrierBills: CarrierBill[];
  matchingResults: MatchingResult[];
  discrepancies: Discrepancy[];
  uploadedFiles: UploadedFile[];

  setVoyageDetails: (data: VoyageDetail[]) => void;
  setPortFees: (data: PortFee[]) => void;
  setBunkerFees: (data: BunkerFee[]) => void;
  setCarrierBills: (data: CarrierBill[]) => void;
  setMatchingRules: (rules: MatchingRules) => void;
  addUploadedFile: (file: UploadedFile) => void;
  addOperationLog: (log: Omit<OperationLog, 'id' | 'createdAt' | 'batchId'>) => void;

  createBatch: (name: string, remark?: string) => string;
  switchBatch: (batchId: string) => void;
  updateBatchName: (batchId: string, name: string) => void;
  deleteBatch: (batchId: string) => void;
  getCurrentBatch: () => ReconciliationBatch | undefined;

  runMatching: () => void;
  updateDiscrepancyComment: (id: string, comment: string) => void;
  updateDiscrepancyStatus: (id: string, status: string) => void;
  batchUpdateDiscrepancies: (ids: string[], updates: { status?: string; comment?: string }) => void;
  confirmBills: (billIds: string[]) => void;
  manualMatch: (transportType: TransportType, transportId: string, billId: string) => void;
  mergeMatchingResults: (resultIds: string[]) => void;
  splitMatchingResult: (resultId: string) => void;
  getStats: () => AppStats;
  resetToMockData: () => void;
  setHasHydrated: (v: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getFeeTypeLabel = (type: TransportType): string => {
  switch (type) {
    case 'voyage':
      return '运费';
    case 'port-fee':
      return '港杂费';
    case 'bunker-fee':
      return '燃油附加费';
    default:
      return '';
  }
};

const isFeeTypeMatch = (transportType: TransportType, billFeeType: string): boolean => {
  if (!billFeeType) return true;
  const billLower = billFeeType.toLowerCase();
  if (transportType === 'voyage') {
    return billLower.includes('运费') || billLower.includes('freight');
  }
  if (transportType === 'port-fee') {
    return billLower.includes('港杂') || billLower.includes('港务') || billLower.includes('装卸') || billLower.includes('port');
  }
  if (transportType === 'bunker-fee') {
    return billLower.includes('燃油') || billLower.includes('bunker') || billLower.includes('油费');
  }
  return false;
};

const createEmptyBatchData = (): BatchData => ({
  voyageDetails: [],
  portFees: [],
  bunkerFees: [],
  carrierBills: [],
  matchingResults: [],
  discrepancies: [],
  uploadedFiles: [],
});

const createInitialBatch = (): { batch: ReconciliationBatch; data: BatchData } => {
  const id = generateId();
  const now = new Date().toISOString();
  const batch: ReconciliationBatch = {
    id,
    name: '初始对账批次',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    remark: '系统默认初始批次',
  };
  const data: BatchData = {
    voyageDetails: mockVoyageDetails,
    portFees: mockPortFees,
    bunkerFees: mockBunkerFees,
    carrierBills: mockCarrierBills,
    matchingResults: [],
    discrepancies: [],
    uploadedFiles: [],
  };
  return { batch, data };
};

const { batch: initialBatch, data: initialData } = createInitialBatch();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentBatchId: initialBatch.id,
      batches: [initialBatch],
      batchDataMap: { [initialBatch.id]: initialData },
      operationLogs: [],
      matchingRules: defaultMatchingRules,
      matchingProgress: 0,
      isMatching: false,
      _hasHydrated: false,

      voyageDetails: initialData.voyageDetails,
      portFees: initialData.portFees,
      bunkerFees: initialData.bunkerFees,
      carrierBills: initialData.carrierBills,
      matchingResults: initialData.matchingResults,
      discrepancies: initialData.discrepancies,
      uploadedFiles: initialData.uploadedFiles,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      getCurrentBatch: () => {
        const state = get();
        return state.batches.find((b) => b.id === state.currentBatchId);
      },

      createBatch: (name, remark = '') => {
        const id = generateId();
        const now = new Date().toISOString();
        const newBatch: ReconciliationBatch = {
          id,
          name,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          remark,
        };
        const newData = createEmptyBatchData();

        set((state) => ({
          batches: [...state.batches, newBatch],
          batchDataMap: { ...state.batchDataMap, [id]: newData },
          currentBatchId: id,
          voyageDetails: newData.voyageDetails,
          portFees: newData.portFees,
          bunkerFees: newData.bunkerFees,
          carrierBills: newData.carrierBills,
          matchingResults: newData.matchingResults,
          discrepancies: newData.discrepancies,
          uploadedFiles: newData.uploadedFiles,
        }));

        get().addOperationLog({
          operationType: '批次管理',
          operator: '张财务',
          description: '创建对账批次',
          detail: `创建批次「${name}」`,
        });

        return id;
      },

      switchBatch: (batchId) => {
        const state = get();
        const batch = state.batches.find((b) => b.id === batchId);
        if (!batch) return;

        const data = state.batchDataMap[batchId] || createEmptyBatchData();

        set({
          currentBatchId: batchId,
          voyageDetails: data.voyageDetails,
          portFees: data.portFees,
          bunkerFees: data.bunkerFees,
          carrierBills: data.carrierBills,
          matchingResults: data.matchingResults,
          discrepancies: data.discrepancies,
          uploadedFiles: data.uploadedFiles,
        });

        get().addOperationLog({
          operationType: '批次管理',
          operator: '张财务',
          description: '切换对账批次',
          detail: `切换到批次「${batch.name}」`,
        });
      },

      updateBatchName: (batchId, name) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, name, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      deleteBatch: (batchId) => {
        set((state) => {
          if (state.batches.length <= 1) return state;

          const remainingBatches = state.batches.filter((b) => b.id !== batchId);
          const newMap = { ...state.batchDataMap };
          delete newMap[batchId];

          const newCurrentId = state.currentBatchId === batchId
            ? remainingBatches[remainingBatches.length - 1].id
            : state.currentBatchId;

          const newData = newMap[newCurrentId] || createEmptyBatchData();
          const newLogs = state.operationLogs.filter((l) => l.batchId !== batchId);

          return {
            batches: remainingBatches,
            batchDataMap: newMap,
            currentBatchId: newCurrentId,
            operationLogs: newLogs,
            voyageDetails: newData.voyageDetails,
            portFees: newData.portFees,
            bunkerFees: newData.bunkerFees,
            carrierBills: newData.carrierBills,
            matchingResults: newData.matchingResults,
            discrepancies: newData.discrepancies,
            uploadedFiles: newData.uploadedFiles,
          };
        });
      },

      setVoyageDetails: (data) =>
        set((state) => ({
          voyageDetails: data,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              voyageDetails: data,
            },
          },
        })),

      setPortFees: (data) =>
        set((state) => ({
          portFees: data,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              portFees: data,
            },
          },
        })),

      setBunkerFees: (data) =>
        set((state) => ({
          bunkerFees: data,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              bunkerFees: data,
            },
          },
        })),

      setCarrierBills: (data) =>
        set((state) => ({
          carrierBills: data,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              carrierBills: data,
            },
          },
        })),

      setMatchingRules: (rules) => set({ matchingRules: rules }),

      addUploadedFile: (file) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              uploadedFiles: [...state.batchDataMap[state.currentBatchId].uploadedFiles, file],
            },
          },
        })),

      addOperationLog: (log) =>
        set((state) => ({
          operationLogs: [
            {
              ...log,
              id: generateId(),
              batchId: state.currentBatchId,
              createdAt: new Date().toISOString(),
            },
            ...state.operationLogs,
          ],
        })),

      runMatching: () => {
        set({ isMatching: true, matchingProgress: 0 });

        setTimeout(() => {
          const rules = get().matchingRules;
          const voyages = get().voyageDetails;
          const portFeesList = get().portFees;
          const bunkerFeesList = get().bunkerFees;
          const bills = get().carrierBills;

          const results: MatchingResult[] = [];
          const discList: Discrepancy[] = [];

          set({ matchingProgress: 15 });

          const isDateMatch = (date1: string, date2: string, tolerance: number): boolean => {
            if (!date1 || !date2) return true;
            const d1 = new Date(date1).getTime();
            const d2 = new Date(date2).getTime();
            if (isNaN(d1) || isNaN(d2)) return true;
            const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
            return diff <= tolerance;
          };

          let progress = 15;
          const totalRecords = voyages.length + portFeesList.length + bunkerFeesList.length;

          const matchTransportRecords = (
            records: any[],
            type: TransportType,
            amountField: string,
            dateField: string
          ) => {
            records.forEach((record) => {
              const matchedBills = bills.filter((bill) => {
                if (rules.vesselNameEnabled && record.vesselName !== bill.vesselName) return false;
                if (rules.voyageNumberEnabled && record.voyageNumber !== bill.voyageNumber) return false;
                if (rules.portsEnabled && type === 'voyage') {
                  if (record.loadingPort !== bill.loadingPort || record.dischargePort !== bill.dischargePort) {
                    return false;
                  }
                }
                if (rules.dateEnabled) {
                  const recordDate = record[dateField];
                  if (!isDateMatch(recordDate, bill.billDate, rules.dateToleranceDays)) return false;
                }
                if (rules.feeTypeCheck !== false) {
                  if (!isFeeTypeMatch(type, bill.feeType)) return false;
                }
                return true;
              });

              if (matchedBills.length === 0) {
                const disc: Discrepancy = {
                  id: generateId(),
                  type: 'missing',
                  matchingResultId: '',
                  description: `${getFeeTypeLabel(type)}记录 ${record.vesselName}/${record.voyageNumber} 未找到匹配账单`,
                  diffAmount: record[amountField] || record.amount || 0,
                  diffPercent: 100,
                  status: 'pending',
                  comment: '',
                  createdAt: new Date().toISOString(),
                };
                discList.push(disc);

                results.push({
                  id: generateId(),
                  transportType: type,
                  transportRecordId: record.id,
                  carrierBillId: '',
                  matchScore: 0,
                  status: 'discrepancy',
                  discrepancies: [disc],
                  matchedAt: new Date().toISOString(),
                  manualAdjusted: false,
                });
              } else if (matchedBills.length > 1) {
                const disc: Discrepancy = {
                  id: generateId(),
                  type: 'duplicate',
                  matchingResultId: '',
                  description: `${record.vesselName}/${record.voyageNumber} 匹配到${matchedBills.length}张${getFeeTypeLabel(type)}账单`,
                  diffAmount: 0,
                  diffPercent: 0,
                  status: 'pending',
                  comment: '',
                  createdAt: new Date().toISOString(),
                };
                discList.push(disc);

                matchedBills.forEach((bill) => {
                  results.push({
                    id: generateId(),
                    transportType: type,
                    transportRecordId: record.id,
                    carrierBillId: bill.id,
                    matchScore: 75,
                    status: 'discrepancy',
                    discrepancies: [disc],
                    matchedAt: new Date().toISOString(),
                    manualAdjusted: false,
                  });
                });
              } else {
                const bill = matchedBills[0];
                const recordAmount = record[amountField] || record.amount || 0;
                const diffAmount = Math.abs(recordAmount - bill.totalAmount);
                const diffPercent = recordAmount > 0 ? (diffAmount / recordAmount) * 100 : 0;

                const recordDiscs: Discrepancy[] = [];

                if (rules.currencyCheck && record.currency !== bill.currency) {
                  const disc: Discrepancy = {
                    id: generateId(),
                    type: 'currency-mismatch',
                    matchingResultId: '',
                    description: `币种不一致：记录${record.currency} vs 账单${bill.currency}`,
                    diffAmount: 0,
                    diffPercent: 0,
                    status: 'pending',
                    comment: '',
                    createdAt: new Date().toISOString(),
                  };
                  recordDiscs.push(disc);
                  discList.push(disc);
                }

                if (rules.amountEnabled && diffPercent > rules.amountTolerancePercent) {
                  const disc: Discrepancy = {
                    id: generateId(),
                    type: 'amount-exceed',
                    matchingResultId: '',
                    description: `金额差异${diffPercent.toFixed(2)}%超出容差${rules.amountTolerancePercent}%`,
                    diffAmount,
                    diffPercent,
                    status: 'pending',
                    comment: '',
                    createdAt: new Date().toISOString(),
                  };
                  recordDiscs.push(disc);
                  discList.push(disc);
                }

                let score = 100;
                if (recordDiscs.length > 0) {
                  score = 100 - recordDiscs.length * 25;
                }

                results.push({
                  id: generateId(),
                  transportType: type,
                  transportRecordId: record.id,
                  carrierBillId: bill.id,
                  matchScore: Math.max(score, 40),
                  status: recordDiscs.length > 0 ? 'discrepancy' : 'matched',
                  discrepancies: recordDiscs,
                  matchedAt: new Date().toISOString(),
                  manualAdjusted: false,
                });
              }

              if (totalRecords > 0) {
                progress += 70 / totalRecords;
                set({ matchingProgress: Math.min(progress, 85) });
              }
            });
          };

          matchTransportRecords(voyages, 'voyage', 'freightAmount', 'sailingDate');
          matchTransportRecords(portFeesList, 'port-fee', 'amount', 'feeDate');
          matchTransportRecords(bunkerFeesList, 'bunker-fee', 'amount', 'feeDate');

          const unmatchedBills = bills.filter(
            (bill) => !results.some((r) => r.carrierBillId === bill.id)
          );
          unmatchedBills.forEach((bill) => {
            const disc: Discrepancy = {
              id: generateId(),
              type: 'missing',
              matchingResultId: '',
              description: `账单${bill.billNumber}(${bill.feeType})未找到匹配的运输记录`,
              diffAmount: bill.totalAmount,
              diffPercent: 100,
              status: 'pending',
              comment: '',
              createdAt: new Date().toISOString(),
            };
            discList.push(disc);
          });

          const billMatchMap = new Map<string, MatchingResult[]>();
          results.forEach((r) => {
            if (r.carrierBillId) {
              const existing = billMatchMap.get(r.carrierBillId) || [];
              existing.push(r);
              billMatchMap.set(r.carrierBillId, existing);
            }
          });

          const updatedBills = bills.map((bill) => {
            const matched = billMatchMap.get(bill.id) || [];
            if (matched.length === 0) {
              return { ...bill, status: 'pending' as const };
            }
            const hasDiscrepancy = matched.some((m) => m.status === 'discrepancy');
            return {
              ...bill,
              status: hasDiscrepancy ? 'discrepancy' as const : 'matched' as const,
            };
          });

          discList.forEach((disc) => {
            const result = results.find((r) => r.discrepancies.some((d) => d.id === disc.id));
            if (result) {
              disc.matchingResultId = result.id;
              result.discrepancies = result.discrepancies.map((d) =>
                d.id === disc.id ? { ...d, matchingResultId: result.id } : d
              );
            }
          });

          set({ matchingProgress: 100 });

          setTimeout(() => {
            const state = get();
            set({
              matchingResults: results,
              discrepancies: discList,
              carrierBills: updatedBills,
              isMatching: false,
              batchDataMap: {
                ...state.batchDataMap,
                [state.currentBatchId]: {
                  ...state.batchDataMap[state.currentBatchId],
                  matchingResults: results,
                  discrepancies: discList,
                  carrierBills: updatedBills,
                },
              },
            });

            get().addOperationLog({
              operationType: '自动匹配',
              operator: '张财务',
              description: '执行自动匹配',
              detail: `共匹配${results.length}条记录，发现${discList.length}个差异（重复收费:${discList.filter(d=>d.type==='duplicate').length}、漏收费用:${discList.filter(d=>d.type==='missing').length}、金额超限:${discList.filter(d=>d.type==='amount-exceed').length}、币种不一致:${discList.filter(d=>d.type==='currency-mismatch').length}）`,
            });
          }, 500);
        }, 300);
      },

      updateDiscrepancyComment: (id, comment) =>
        set((state) => {
          const updated = state.discrepancies.map((d) =>
            d.id === id ? { ...d, comment } : d
          );
          return {
            discrepancies: updated,
            batchDataMap: {
              ...state.batchDataMap,
              [state.currentBatchId]: {
                ...state.batchDataMap[state.currentBatchId],
                discrepancies: updated,
              },
            },
          };
        }),

      updateDiscrepancyStatus: (id, status) => {
        const state = get();
        const disc = state.discrepancies.find((d) => d.id === id);
        const newStatus = status as DiscrepancyStatus;

        let updatedBills = state.carrierBills;
        if (disc && disc.matchingResultId) {
          const result = state.matchingResults.find((r) => r.id === disc.matchingResultId);
          if (result && result.carrierBillId) {
            if (newStatus === 'resolved') {
              const otherDiscsForBill = state.discrepancies.filter(
                (d) =>
                  d.id !== id &&
                  d.matchingResultId &&
                  state.matchingResults.find((r) => r.id === d.matchingResultId)?.carrierBillId === result.carrierBillId &&
                  d.status !== 'resolved'
              );
              if (otherDiscsForBill.length === 0) {
                updatedBills = state.carrierBills.map((b) =>
                  b.id === result.carrierBillId ? { ...b, status: 'matched' as const } : b
                );
              }
            } else if (newStatus === 'disputed' || newStatus === 'processing') {
              updatedBills = state.carrierBills.map((b) =>
                b.id === result.carrierBillId ? { ...b, status: 'discrepancy' as const } : b
              );
            }
          }
        }

        const updatedDiscs = state.discrepancies.map((d) =>
          d.id === id ? { ...d, status: newStatus } : d
        );

        set({
          discrepancies: updatedDiscs,
          carrierBills: updatedBills,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              discrepancies: updatedDiscs,
              carrierBills: updatedBills,
            },
          },
        });
      },

      batchUpdateDiscrepancies: (ids, updates) => {
        const state = get();
        let updatedDiscs = [...state.discrepancies];
        let updatedBills = [...state.carrierBills];

        ids.forEach((id) => {
          const disc = updatedDiscs.find((d) => d.id === id);
          if (!disc) return;

          if (updates.status !== undefined) {
            disc.status = updates.status as DiscrepancyStatus;
          }
          if (updates.comment !== undefined) {
            disc.comment = updates.comment;
          }

          if (updates.status && disc.matchingResultId) {
            const result = state.matchingResults.find((r) => r.id === disc.matchingResultId);
            if (result && result.carrierBillId) {
              const billId = result.carrierBillId;
              const newStatus = updates.status as DiscrepancyStatus;

              const otherDiscsForBill = updatedDiscs.filter(
                (d) =>
                  d.id !== id &&
                  d.matchingResultId &&
                  state.matchingResults.find((r) => r.id === d.matchingResultId)?.carrierBillId === billId &&
                  d.status !== 'resolved'
              );

              const billIdx = updatedBills.findIndex((b) => b.id === billId);
              if (billIdx >= 0) {
                if (newStatus === 'resolved' && otherDiscsForBill.length === 0) {
                  updatedBills[billIdx] = { ...updatedBills[billIdx], status: 'matched' as const };
                } else if (newStatus === 'disputed' || newStatus === 'processing') {
                  updatedBills[billIdx] = { ...updatedBills[billIdx], status: 'discrepancy' as const };
                }
              }
            }
          }
        });

        updatedDiscs = updatedDiscs.map((d) => {
          const match = state.discrepancies.find((orig) => orig.id === d.id);
          return match ? { ...match, ...d } : d;
        });

        set({
          discrepancies: updatedDiscs,
          carrierBills: updatedBills,
          batchDataMap: {
            ...state.batchDataMap,
            [state.currentBatchId]: {
              ...state.batchDataMap[state.currentBatchId],
              discrepancies: updatedDiscs,
              carrierBills: updatedBills,
            },
          },
        });
      },

      confirmBills: (billIds) =>
        set((state) => {
          const confirmable = state.carrierBills.filter(
            (b) => billIds.includes(b.id) && b.status === 'matched'
          );
          const confirmableIds = confirmable.map((b) => b.id);

          const updatedBills = state.carrierBills.map((bill) =>
            confirmableIds.includes(bill.id) ? { ...bill, status: 'confirmed' as const } : bill
          );

          return {
            carrierBills: updatedBills,
            batchDataMap: {
              ...state.batchDataMap,
              [state.currentBatchId]: {
                ...state.batchDataMap[state.currentBatchId],
                carrierBills: updatedBills,
              },
            },
          };
        }),

      manualMatch: (transportType, transportId, billId) => {
        const newResult: MatchingResult = {
          id: generateId(),
          transportType,
          transportRecordId: transportId,
          carrierBillId: billId,
          matchScore: 100,
          status: 'matched',
          discrepancies: [],
          matchedAt: new Date().toISOString(),
          manualAdjusted: true,
        };

        set((state) => {
          const oldResults = state.matchingResults.filter(
            (r) => !(r.transportRecordId === transportId && r.transportType === transportType)
          );

          const bill = state.carrierBills.find((b) => b.id === billId);
          const updatedBill = bill ? { ...bill, status: 'matched' as const } : bill;

          const updatedBills = state.carrierBills.map((b) =>
            b.id === billId ? updatedBill || b : b
          );

          const newResults = [...oldResults, newResult];

          return {
            matchingResults: newResults,
            carrierBills: updatedBills,
            batchDataMap: {
              ...state.batchDataMap,
              [state.currentBatchId]: {
                ...state.batchDataMap[state.currentBatchId],
                matchingResults: newResults,
                carrierBills: updatedBills,
              },
            },
          };
        });

        get().addOperationLog({
          operationType: '手动匹配',
          operator: '张财务',
          description: '手动创建匹配',
          detail: `运输记录${transportId}与账单${billId}手动匹配`,
        });
      },

      mergeMatchingResults: (resultIds) => {
        set((state) => {
          const resultsToMerge = state.matchingResults.filter((r) => resultIds.includes(r.id));
          if (resultsToMerge.length < 2) return state;

          const mergedResult: MatchingResult = {
            ...resultsToMerge[0],
            id: generateId(),
            matchScore: Math.max(...resultsToMerge.map((r) => r.matchScore)),
            discrepancies: resultsToMerge.flatMap((r) => r.discrepancies),
            manualAdjusted: true,
            status: resultsToMerge.some((r) => r.status === 'discrepancy') ? 'discrepancy' : 'matched',
          };

          const remainingResults = state.matchingResults.filter(
            (r) => !resultIds.includes(r.id)
          );

          const updatedDiscrepancies = state.discrepancies.filter(
            (d) => !resultsToMerge.some((r) => r.discrepancies.some((rd) => rd.id === d.id))
          );

          const newDiscs = mergedResult.discrepancies.map((d) => ({
            ...d,
            matchingResultId: mergedResult.id,
          }));
          mergedResult.discrepancies = newDiscs;

          const finalDiscs = [...updatedDiscrepancies, ...newDiscs];
          const finalResults = [...remainingResults, mergedResult];

          return {
            matchingResults: finalResults,
            discrepancies: finalDiscs,
            batchDataMap: {
              ...state.batchDataMap,
              [state.currentBatchId]: {
                ...state.batchDataMap[state.currentBatchId],
                matchingResults: finalResults,
                discrepancies: finalDiscs,
              },
            },
          };
        });

        get().addOperationLog({
          operationType: '合并匹配',
          operator: '张财务',
          description: '合并匹配结果',
          detail: `合并了${resultIds.length}条匹配记录`,
        });
      },

      splitMatchingResult: (resultId) => {
        set((state) => {
          const result = state.matchingResults.find((r) => r.id === resultId);
          if (!result || !result.carrierBillId) return state;

          const billId = result.carrierBillId;
          const transportId = result.transportRecordId;
          const transportType = result.transportType;

          const remainingResults = state.matchingResults.filter((r) => r.id !== resultId);

          const transportResult: MatchingResult = {
            id: generateId(),
            transportType,
            transportRecordId: transportId,
            carrierBillId: '',
            matchScore: 0,
            status: 'pending',
            discrepancies: [],
            matchedAt: new Date().toISOString(),
            manualAdjusted: true,
          };

          const billResult: MatchingResult = {
            id: generateId(),
            transportType,
            transportRecordId: '',
            carrierBillId: billId,
            matchScore: 0,
            status: 'pending',
            discrepancies: [],
            matchedAt: new Date().toISOString(),
            manualAdjusted: true,
          };

          const allResultsAfter = [...remainingResults, transportResult, billResult];

          const removedDiscIds = new Set(result.discrepancies.map((d) => d.id));

          const updatedDiscs = state.discrepancies.filter((disc) => {
            if (!removedDiscIds.has(disc.id)) return true;

            const isStillReferenced = allResultsAfter.some(
              (r) => r.discrepancies.some((rd) => rd.id === disc.id)
            );
            return isStillReferenced;
          });

          const billMatches = allResultsAfter.filter((r) => r.carrierBillId === billId);

          let newBillStatus: 'pending' | 'matched' | 'discrepancy' | 'confirmed' = 'pending';
          if (billMatches.length > 0) {
            const hasUnresolvedDisc = billMatches.some((r) =>
              r.discrepancies.some((d) => {
                const fullDisc = updatedDiscs.find((dd) => dd.id === d.id);
                return fullDisc && fullDisc.status !== 'resolved';
              })
            );
            newBillStatus = hasUnresolvedDisc ? 'discrepancy' : 'matched';
          }

          const updatedBills = state.carrierBills.map((b) =>
            b.id === billId ? { ...b, status: newBillStatus } : b
          );

          return {
            matchingResults: allResultsAfter,
            discrepancies: updatedDiscs,
            carrierBills: updatedBills,
            batchDataMap: {
              ...state.batchDataMap,
              [state.currentBatchId]: {
                ...state.batchDataMap[state.currentBatchId],
                matchingResults: allResultsAfter,
                discrepancies: updatedDiscs,
                carrierBills: updatedBills,
              },
            },
          };
        });

        get().addOperationLog({
          operationType: '拆分匹配',
          operator: '张财务',
          description: '拆分匹配结果',
          detail: `拆分了匹配记录${resultId}，原差异已移除，账单状态已同步更新`,
        });
      },

      getStats: () => {
        const state = get();
        const bills = state.carrierBills;
        const totalBills = bills.length;
        const matchedCount = bills.filter((b) => b.status === 'matched').length;
        const discrepancyCount = bills.filter((b) => b.status === 'discrepancy').length;
        const pendingCount = bills.filter((b) => b.status === 'pending').length;
        const confirmedCount = bills.filter((b) => b.status === 'confirmed').length;
        const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        const matchedAmount = bills
          .filter((b) => b.status === 'matched' || b.status === 'confirmed')
          .reduce((sum, b) => sum + b.totalAmount, 0);

        return {
          totalBills,
          matchedCount,
          discrepancyCount,
          pendingCount,
          confirmedCount,
          totalAmount,
          matchedAmount,
        };
      },

      resetToMockData: () => {
        const { batch: newBatch, data: newData } = createInitialBatch();

        set({
          currentBatchId: newBatch.id,
          batches: [newBatch],
          batchDataMap: { [newBatch.id]: newData },
          operationLogs: [],
          voyageDetails: newData.voyageDetails,
          portFees: newData.portFees,
          bunkerFees: newData.bunkerFees,
          carrierBills: newData.carrierBills,
          matchingResults: newData.matchingResults,
          discrepancies: newData.discrepancies,
          uploadedFiles: newData.uploadedFiles,
          matchingRules: defaultMatchingRules,
        });
      },
    }),
    {
      name: 'water-freight-audit-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentBatchId: state.currentBatchId,
        batches: state.batches,
        batchDataMap: state.batchDataMap,
        operationLogs: state.operationLogs,
        matchingRules: state.matchingRules,
        voyageDetails: state.voyageDetails,
        portFees: state.portFees,
        bunkerFees: state.bunkerFees,
        carrierBills: state.carrierBills,
        matchingResults: state.matchingResults,
        discrepancies: state.discrepancies,
        uploadedFiles: state.uploadedFiles,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
