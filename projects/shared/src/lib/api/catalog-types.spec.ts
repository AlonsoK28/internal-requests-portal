import { normalizeCatalogTypes } from './catalog-types';

describe('normalizeCatalogTypes', () => {
  it('normalizes string amounts', () => {
    expect(normalizeCatalogTypes([{ id: 'access', name: 'Acceso', description: 'Sistemas', amount: '0',
      requiredFields: ['system', 'justification'] }])[0].amount).toBe(0);
  });

  it('rejects an invalid catalog', () => {
    expect(() => normalizeCatalogTypes([{ id: 'equipment', name: 'Equipo', description: '', amount: 'bad',
      requiredFields: ['model', 'amount'] }])).toThrow();
  });
});
