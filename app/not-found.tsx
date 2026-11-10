import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="wrap section narrow">
      <h1 className="h1">Page not found</h1>
      <p className="muted">That page does not exist.</p>
      <Link href="/" className="btn primary">Back home</Link>
    </div>
  );
}
