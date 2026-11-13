import { RequestType } from './api.models';

export interface CatalogType {
  id: RequestType;
  name: string;
  description: string;
  amount: number;
  requiredFields: readonly string[];
}

const fields: Record<RequestType, readonly string[]> = {
  equipment: ['model', 'amount'],
  access: ['system', 'justification'],
  travel: ['destination', 'startDate', 'endDate', 'amount'],
};

export function normalizeCatalogTypes(value: unknown): CatalogType[] {
  if (!Array.isArray(value)) throw new TypeError('Catálogo de tipos inválido');
  const seen = new Set<RequestType>();
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new TypeError('Tipo de solicitud inválido');
    const row = item as Record<string, unknown>;
    const id = row['id'];
    if (id !== 'equipment' && id !== 'access' && id !== 'travel') throw new TypeError('Tipo de solicitud desconocido');
    if (seen.has(id)) throw new TypeError('Tipo de solicitud duplicado');
    seen.add(id);
    const requiredFields = row['requiredFields'];
    if (typeof row['name'] !== 'string' || !row['name'].trim() ||
        typeof row['description'] !== 'string' ||
        !Array.isArray(requiredFields) ||
        requiredFields.length !== fields[id].length ||
        !fields[id].every(field => requiredFields.includes(field))) {
      throw new TypeError('Estructura del tipo de solicitud inválida');
    }
    const rawAmount = row['amount'];
    if (typeof rawAmount !== 'number' && (typeof rawAmount !== 'string' || !rawAmount.trim())) {
      throw new TypeError('Monto del catálogo inválido');
    }
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount < 0) throw new TypeError('Monto del catálogo inválido');
    return { id, name: row['name'], description: row['description'], amount, requiredFields: fields[id] };
  });
}
