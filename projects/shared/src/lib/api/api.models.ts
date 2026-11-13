export type UserRole = 'employee' | 'approver';
export type RequestType = 'equipment' | 'access' | 'travel';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: ApiUser;
}

export interface EquipmentDetails { model: string; }
export interface AccessDetails { system: string; justification: string; }
export interface TravelDetails { destination: string; startDate: string; endDate: string; }

export interface RequestBase<T extends RequestType, D> {
  id: number;
  title: string;
  type: T;
  status: RequestStatus;
  requesterId: number;
  requesterName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  details: D;
  amount?: number;
  decidedBy?: number;
  decidedAt?: string;
  decisionComment?: string;
}

export type ApiRequest =
  | RequestBase<'equipment', EquipmentDetails>
  | RequestBase<'access', AccessDetails>
  | RequestBase<'travel', TravelDetails>;

export type CreateRequest =
  | { type: 'equipment'; title: string; amount: number; details: EquipmentDetails }
  | { type: 'access'; title: string; details: AccessDetails }
  | { type: 'travel'; title: string; amount: number; details: TravelDetails };

export type RequestDecision =
  | { status: 'approved'; version: number }
  | { status: 'rejected'; version: number; decisionComment: string };

export interface RequestQuery {
  _page?: number;
  _limit?: number;
  q?: string;
  status?: RequestStatus;
  type?: RequestType;
  _sort?: string;
  _order?: 'asc' | 'desc';
}

export interface RequestPage {
  items: ApiRequest[];
  totalCount: number | null;
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface VersionConflictError {
  message?: string;
  code: 'VERSION_CONFLICT';
  current: ApiRequest;
}

export interface AuthError {
  code: 'UNAUTHORIZED' | 'TOKEN_EXPIRED';
}

