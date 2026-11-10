'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function Gallery({ slug, shots, name }: { slug: string; shots: string[]; name: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Image key={shots[i]} src={`/img/${slug}/${shots[i]}.webp`} alt={`${name} screenshot ${i + 1}`} width={1280} height={750} sizes="(max-width: 900px) 100vw, 760px" />
      </div>
      <div className="thumbs" role="tablist">
        {shots.map((s, n) => (
          <button key={s} role="tab" aria-selected={n === i} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={`Screenshot ${n + 1}`}>
            <Image src={`/img/${slug}/${s}.webp`} alt="" width={160} height={94} />
          </button>
        ))}
      </div>
    </div>
  );
}
