import { ApiRequest } from './api.models';

type WireRequest = Omit<ApiRequest, 'amount'> & { amount?: number | string };

export function normalizeRequest(request: WireRequest): ApiRequest {
  if (request.amount === undefined) return request as ApiRequest;
  const amount = typeof request.amount === 'number' ? request.amount : Number(request.amount);
  if (!Number.isFinite(amount)) throw new TypeError('Invalid request amount');
  return { ...request, amount } as ApiRequest;
}
