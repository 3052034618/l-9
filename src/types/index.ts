export interface VoyageDetail {
  id: string;
  vesselName: string;
  voyageNumber: string;
  loadingPort: string;
  dischargePort: string;
  sailingDate: string;
  arrivalDate: string;
  cargoQuantity: number;
  cargoType: string;
  currency: string;
  freightAmount: number;
  createdAt: string;
}

export interface PortFee {
  id: string;
  vesselName: string;
  voyageNumber: string;
  port: string;
  feeDate: string;
  feeType: string;
  amount: number;
  currency: string;
  remark: string;
}

export interface BunkerFee {
  id: string;
  vesselName: string;
  voyageNumber: string;
  feeDate: string;
  fuelQuantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  bunkerType: string;
}

export interface CarrierBill {
  id: string;
  billNumber: string;
  carrierName: string;
  vesselName: string;
  voyageNumber: string;
  billDate: string;
  currency: string;
  totalAmount: number;
  feeType: string;
  loadingPort: string;
  dischargePort: string;
  status: 'pending' | 'matched' | 'discrepancy' | 'confirmed';
}

export interface MatchingRules {
  vesselNameEnabled: boolean;
  voyageNumberEnabled: boolean;
  portsEnabled: boolean;
  dateEnabled: boolean;
  dateToleranceDays: number;
  amountEnabled: boolean;
  amountTolerancePercent: number;
  currencyCheck: boolean;
  feeTypeCheck: boolean;
}

export type TransportType = 'voyage' | 'port-fee' | 'bunker-fee';

export type DiscrepancyType = 'duplicate' | 'missing' | 'amount-exceed' | 'currency-mismatch';

export type DiscrepancyStatus = 'pending' | 'processing' | 'resolved' | 'disputed';

export interface Discrepancy {
  id: string;
  type: DiscrepancyType;
  matchingResultId: string;
  description: string;
  diffAmount: number;
  diffPercent: number;
  status: DiscrepancyStatus;
  comment: string;
  createdAt: string;
}

export interface MatchingResult {
  id: string;
  transportType: TransportType;
  transportRecordId: string;
  carrierBillId: string;
  matchScore: number;
  status: 'matched' | 'discrepancy' | 'pending';
  discrepancies: Discrepancy[];
  matchedAt: string;
  manualAdjusted: boolean;
}

export interface OperationLog {
  id: string;
  batchId: string;
  operationType: string;
  operator: string;
  description: string;
  detail: string;
  createdAt: string;
}

export interface ReconciliationBatch {
  id: string;
  name: string;
  status: 'draft' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
  remark: string;
}

export interface PaymentListItem {
  id: string;
  billNumber: string;
  carrierName: string;
  vesselName: string;
  voyageNumber: string;
  totalAmount: number;
  currency: string;
  confirmedAt: string;
}

export interface DisputeListItem {
  id: string;
  billNumber: string;
  carrierName: string;
  discrepancyType: string;
  description: string;
  diffAmount: number;
  comment: string;
  status: string;
}

export type FileType = 'voyage' | 'port-fee' | 'bunker-fee' | 'carrier-bill';

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  uploadedAt: string;
  recordCount: number;
}

export interface AppStats {
  totalBills: number;
  matchedCount: number;
  discrepancyCount: number;
  pendingCount: number;
  totalAmount: number;
  matchedAmount: number;
}
