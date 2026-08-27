// Phase 1 connection test page — remove before production
import { getProducts } from '@/lib/woocommerce/products';
import { getCategories } from '@/lib/woocommerce/categories';

interface TestResult {
  label: string;
  ok: boolean;
  detail: string;
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Environment check
  const envOk =
    !!process.env.WORDPRESS_URL &&
    !!process.env.WC_CONSUMER_KEY &&
    !!process.env.WC_CONSUMER_SECRET;

  results.push({
    label: 'Environment variables',
    ok: envOk,
    detail: envOk
      ? `WORDPRESS_URL: ${process.env.WORDPRESS_URL}`
      : 'One or more variables missing in .env.local',
  });

  if (!envOk) return results;

  // Products
  try {
    const products = await getProducts({ per_page: 5 });
    results.push({
      label: 'Products API',
      ok: true,
      detail: `Fetched ${products.length} product(s). First: "${products[0]?.name ?? 'none'}"`,
    });
  } catch (err) {
    results.push({
      label: 'Products API',
      ok: false,
      detail: extractMessage(err),
    });
  }

  // Categories
  try {
    const categories = await getCategories();
    results.push({
      label: 'Categories API',
      ok: true,
      detail: `Fetched ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}. Sample: ${categories
        .slice(0, 5)
        .map((c) => c.name)
        .join(', ')}`,
    });
  } catch (err) {
    results.push({
      label: 'Categories API',
      ok: false,
      detail: extractMessage(err),
    });
  }

  return results;
}

function extractMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { body?: { message?: string; code?: string }; message?: string };
    if (e.body?.message) return `[${e.body.code ?? 'WC'}] ${e.body.message}`;
    if (e.message) return e.message;
  }
  return String(err);
}

export default async function TestPage() {
  const results = await runTests();
  const allOk = results.every((r) => r.ok);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            WooCommerce Connection Test
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Phase 1 — server-side API verification</p>
        </div>

        {/* Overall status banner */}
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
            allOk
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {allOk
            ? '✓ All checks passed — WooCommerce connection is working.'
            : '✗ One or more checks failed. See details below.'}
        </div>

        {/* Results list */}
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.label}
              className="bg-white border border-neutral-200 rounded-lg px-5 py-4 flex items-start gap-4"
            >
              <span
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  r.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {r.ok ? '✓' : '✗'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{r.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500 break-words">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup instructions */}
        {!allOk && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
            <p className="text-sm font-medium text-amber-900 mb-2">Setup checklist</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-amber-800">
              <li>
                Copy <code className="bg-amber-100 px-1 rounded">.env.example</code> to{' '}
                <code className="bg-amber-100 px-1 rounded">.env.local</code>
              </li>
              <li>Set WORDPRESS_URL to your site (e.g. https://example.com)</li>
              <li>
                Generate API keys: WooCommerce → Settings → Advanced → REST API
              </li>
              <li>Set permissions to Read/Write</li>
              <li>Add the key and secret to .env.local</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}

        <p className="mt-6 text-xs text-neutral-400 text-center">
          This page is for development only. Remove it before deploying to production.
        </p>
      </div>
    </div>
  );
}
