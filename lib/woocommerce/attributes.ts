import { wcFetch } from './client';

export interface WCAttributeTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WCAttribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_by: string;
  has_archives: boolean;
}

export async function getAttributes(): Promise<WCAttribute[]> {
  return wcFetch<WCAttribute[]>('/products/attributes');
}

export async function getAttributeTerms(attributeId: number): Promise<WCAttributeTerm[]> {
  return wcFetch<WCAttributeTerm[]>(`/products/attributes/${attributeId}/terms`, {
    params: { per_page: 100 },
  });
}

export async function getAttributesWithTerms(): Promise<Array<WCAttribute & { terms: WCAttributeTerm[] }>> {
  const attributes = await getAttributes();
  const results = await Promise.all(
    attributes.map(async (attr) => {
      const terms = await getAttributeTerms(attr.id);
      return { ...attr, terms };
    })
  );
  return results;
}
