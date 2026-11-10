import type { Metadata } from 'next';
import ScriptBrowser from '@/components/ScriptBrowser';
import { SITE } from '@/lib/config';

export const metadata: Metadata = { title: 'Scripts', description: `All FiveM scripts by ${SITE.name}.` };

export default function Scripts() {
  return (
    <div className="wrap section">
      <h1 className="h1">All scripts</h1>
      <p className="muted lead">Buy {SITE.bundle.min} scripts and get {SITE.bundle.percent}% off automatically.</p>
      <ScriptBrowser />
    </div>
  );
}
