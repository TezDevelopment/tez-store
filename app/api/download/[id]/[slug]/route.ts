import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { paidOrder } from '@/lib/stripe';
import { bySlug } from '@/lib/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const product = bySlug(slug);
  if (!product) return new NextResponse('Not found', { status: 404 });

  const order = await paidOrder(id);
  if (!order || !order.paid || !order.slugs.includes(slug)) return new NextResponse('This download is not available.', { status: 403 });

  try {
    const file = await readFile(path.join(process.cwd(), 'private', 'downloads', `${slug}.zip`));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-v${product.version}.zip"`,
        'Content-Length': String(file.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('The file is missing on the server. Contact support with your order link.', { status: 500 });
  }
}
