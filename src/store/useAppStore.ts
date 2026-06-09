import { create } from 'zustand';
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
  DiscrepancyType,
} from '../types';
import {
  mockVoyageDetails,
  mockPortFees,
  mockBunkerFees,
  mockCarrierBills,
  mockOperationLogs,
  defaultMatchingRules,
} from '../mock/data';

interface AppState {
  voyageDetails: VoyageDetail[];
  portFees: PortFee[];
  bunkerFees: BunkerFee[];
  carrierBills: CarrierBill[];
  matchingResults: MatchingResult[];
  discrepancies: Discrepancy[];
  operationLogs: OperationLog[];
  matchingRules: MatchingRules;
  uploadedFiles: UploadedFile[];
  matchingProgress: number;
  isMatching: boolean;

  setVoyageDetails: (data: VoyageDetail[]) => void;
  setPortFees: (data: PortFee[]) => void;
  setBunkerFees: (data: BunkerFee[]) => void;
  setCarrierBills: (data: CarrierBill[]) => void;
  setMatchingRules: (rules: MatchingRules) => void;
  addUploadedFile: (file: UploadedFile) => void;
  addOperationLog: (log: Omit<OperationLog, 'id' | 'createdAt'>) => void;
  runMatching: () => void;
  updateDiscrepancyComment: (id: string, comment: string) => void;
  updateDiscrepancyStatus: (id: string, status: string) => void;
  confirmBills: (billIds: string[]) => void;
  manualMatch: (transportType: TransportType, transportId: string, billId: string) => void;
  mergeMatchingResults: (resultIds: string[]) => void;
  splitMatchingResult: (resultId: string) => void;
  getStats: () => AppStats;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>((set, get) => ({
  voyageDetails: mockVoyageDetails,
  portFees: mockPortFees,
  bunkerFees: mockBunkerFees,
  carrierBills: mockCarrierBills,
  matchingResults: [],
  discrepancies: [],
  operationLogs: mockOperationLogs,
  matchingRules: defaultMatchingRules,
  uploadedFiles: [],
  matchingProgress: 0,
  isMatching: false,

  setVoyageDetails: (data) => set({ voyageDetails: data }),
  setPortFees: (data) => set({ portFees: data }),
  setBunkerFees: (data) => set({ bunkerFees: data }),
  setCarrierBills: (data) => set({ carrierBills: data }),
  setMatchingRules: (rules) => set({ matchingRules: rules }),

  addUploadedFile: (file) =>
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, file],
    })),

  addOperationLog: (log) =>
    set((state) => ({
      operationLogs: [
        {
          ...log,
          id: generateId(),
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
      const portFees = get().portFees;
      const bunkerFees = get().bunkerFees;
      const bills = get().carrierBills;

      const results: MatchingResult[] = [];
      const discList: Discrepancy[] = [];

      set({ matchingProgress: 20 });

      const isDateMatch = (date1: string, date2: string, tolerance: number): boolean => {
        const d1 = new Date(date1).getTime();
        const d2 = new Date(date2).getTime();
        const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        return diff <= tolerance;
      };

      let progress = 20;

      const matchTransportRecords = (
        records: any[],
        type: TransportType,
        amountField: string
      ) => {
        records.forEach((record) => {
          const matchedBills = bills.filter((bill) => {
            if (rules.vesselNameEnabled && record.vesselName !== bill.vesselName) return false;
            if (rules.voyageNumberEnabled && record.voyageNumber !== bill.voyageNumber) return false;
            if (rules.portsEnabled && (record.loadingPort !== bill.loadingPort || record.dischargePort !== bill.dischargePort)) {
              if (type === 'voyage') return false;
            }
            if (rules.dateEnabled) {
              const recordDate = record.sailingDate || record.feeDate;
              if (!isDateMatch(recordDate, bill.billDate, rules.dateToleranceDays)) return false;
            }
            return true;
          });

          if (matchedBills.length === 0) {
            const disc: Discrepancy = {
              id: generateId(),
              type: 'missing',
              matchingResultId: '',
              description: `${type === 'voyage' ? '航次' : type === 'port-fee' ? '港杂费' : '燃油附加费'}记录${record.voyageNumber}未找到匹配账单`,
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
              description: `${record.voyageNumber}匹配到${matchedBills.length}张账单`,
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
                matchScore: 85,
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
              score = 60 + recordDiscs.reduce((acc, d) => acc - 20, 0);
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

          progress += 60 / (voyages.length + portFees.length + bunkerFees.length);
          set({ matchingProgress: Math.min(progress, 90) });
        });
      };

      matchTransportRecords(voyages, 'voyage', 'freightAmount');
      matchTransportRecords(portFees, 'port-fee', 'amount');
      matchTransportRecords(bunkerFees, 'bunker-fee', 'amount');

      const unmatchedBills = bills.filter(
        (bill) => !results.some((r) => r.carrierBillId === bill.id)
      );
      unmatchedBills.forEach((bill) => {
        const disc: Discrepancy = {
          id: generateId(),
          type: 'missing',
          matchingResultId: '',
          description: `账单${bill.billNumber}未找到匹配的运输记录`,
          diffAmount: bill.totalAmount,
          diffPercent: 100,
          status: 'pending',
          comment: '',
          createdAt: new Date().toISOString(),
        };
        discList.push(disc);
      });

      const updatedBills = bills.map((bill) => {
        const matched = results.filter((r) => r.carrierBillId === bill.id);
        if (matched.length === 0) {
          return { ...bill, status: 'pending' as const };
        }
        const hasDiscrepancy = matched.some((m) => m.status === 'discrepancy');
        return {
          ...bill,
          status: hasDiscrepancy ? 'discrepancy' as const : 'matched' as const,
        };
      });

      discList.forEach((disc, idx) => {
        const result = results.find((r) => r.discrepancies.some((d) => d.id === disc.id));
        if (result) {
          disc.matchingResultId = result.id;
          const resultDiscs = result.discrepancies.map((d) =>
            d.id === disc.id ? { ...d, matchingResultId: result.id } : d
          );
          results[idx] = { ...result, discrepancies: resultDiscs };
        }
      });

      set({ matchingProgress: 100 });

      setTimeout(() => {
        set({
          matchingResults: results,
          discrepancies: discList,
          carrierBills: updatedBills,
          isMatching: false,
        });

        get().addOperationLog({
          operationType: '自动匹配',
          operator: '张财务',
          description: '执行自动匹配',
          detail: `共匹配${results.length}条记录，发现${discList.length}个差异`,
        });
      }, 500);
    }, 300);
  },

  updateDiscrepancyComment: (id, comment) =>
    set((state) => ({
      discrepancies: state.discrepancies.map((d) =>
        d.id === id ? { ...d, comment } : d
      ),
    })),

  updateDiscrepancyStatus: (id, status) =>
    set((state) => ({
      discrepancies: state.discrepancies.map((d) =>
        d.id === id ? { ...d, status: status as any } : d
      ),
    })),

  confirmBills: (billIds) =>
    set((state) => {
      const updatedBills = state.carrierBills.map((bill) =>
        billIds.includes(bill.id) ? { ...bill, status: 'confirmed' as const } : bill
      );
      return { carrierBills: updatedBills };
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

    set((state) => ({
      matchingResults: [...state.matchingResults, newResult],
      carrierBills: state.carrierBills.map((b) =>
        b.id === billId ? { ...b, status: 'matched' } : b
      ),
    }));

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
      };

      const remainingResults = state.matchingResults.filter(
        (r) => !resultIds.includes(r.id)
      );

      return {
        matchingResults: [...remainingResults, mergedResult],
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
      if (!result) return state;

      const split1: MatchingResult = {
        ...result,
        id: generateId(),
        manualAdjusted: true,
      };

      const split2: MatchingResult = {
        ...result,
        id: generateId(),
        carrierBillId: '',
        matchScore: 0,
        status: 'pending',
        discrepancies: [],
        manualAdjusted: true,
      };

      const remainingResults = state.matchingResults.filter((r) => r.id !== resultId);

      return {
        matchingResults: [...remainingResults, split1, split2],
      };
    });

    get().addOperationLog({
      operationType: '拆分匹配',
      operator: '张财务',
      description: '拆分匹配结果',
      detail: `拆分了匹配记录${resultId}`,
    });
  },

  getStats: () => {
    const state = get();
    const bills = state.carrierBills;
    const totalBills = bills.length;
    const matchedCount = bills.filter((b) => b.status === 'matched').length;
    const discrepancyCount = bills.filter((b) => b.status === 'discrepancy').length;
    const pendingCount = bills.filter((b) => b.status === 'pending').length;
    const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const matchedAmount = bills
      .filter((b) => b.status === 'matched' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalBills,
      matchedCount,
      discrepancyCount,
      pendingCount,
      totalAmount,
      matchedAmount,
    };
  },
}));
