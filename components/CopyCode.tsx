'use client';
import { useState } from 'react';
import Icon from './Icon';
export default function CopyCode({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="code">
      <code>{text}</code>
      <button className="icon-btn" aria-label="Copy" onClick={() => { try { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch {} }}>
        {done ? <><Icon name="check" size={15} /> <span className="tiny">Copied</span></> : <Icon name="terminal" size={15} />}
      </button>
    </div>
  );
}
