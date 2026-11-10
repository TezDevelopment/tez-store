import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
export const metadata: Metadata = { title: 'Terms and licence' };
export default function Terms() {
  return (
    <div className="wrap section narrow legal">
      <h1 className="h1">Terms and licence</h1>
      <p className="muted">Template text. Read it, edit it to match how you really work, and have it checked if you need to.</p>
      <h2>Your licence</h2>
      <p>When you buy a script from {SITE.name} you get a personal, non-transferable licence to use it on one live FiveM server and one test server that you run.</p>
      <h2>What you may do</h2>
      <p>You may edit the code and config for your own server.</p>
      <h2>What you may not do</h2>
      <p>You may not resell, share, leak, upload or give away the script or any part of it, including edited versions. You may not claim it as your own work. We may remove your access if you break these rules.</p>
      <h2>Support and updates</h2>
      <p>Support is given through our Discord. We try to fix real bugs, but we cannot promise it will work with every custom or heavily edited server.</p>
      <h2>No warranty</h2>
      <p>Scripts are provided as they are. We are not responsible for losses caused by using them on your server.</p>
      <h2>Contact</h2>
      <p><a href={SITE.discord}>Discord</a>{SITE.supportEmail ? <> or {SITE.supportEmail}</> : null}.</p>
    </div>
  );
}
