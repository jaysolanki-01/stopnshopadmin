import { wcFetch } from './client';
import type { WCCategory } from '@/types/woocommerce';

// Fetches every category by looping through WooCommerce pages (max 100/page)
export async function getCategories(): Promise<WCCategory[]> {
  const all: WCCategory[] = [];
  let page = 1;
  const perPage = 100;

  for (;;) {
    const batch = await wcFetch<WCCategory[]>('/products/categories', {
      params: { page, per_page: perPage, orderby: 'name', order: 'asc', hide_empty: false },
    });
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return all;
}
