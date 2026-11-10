'use client';
import { useEffect, useRef } from 'react';

// A looping case replay drawn in SVG. It needs no images and no scripts to move.
export default function ReplayHero() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try { svg.pauseAnimations(); svg.setCurrentTime(4.6); } catch {}
  }, []);
  const A = 'M60 300 C130 292 175 236 250 214 S392 170 500 84';   // reporter
  const B = 'M54 118 C128 132 190 176 252 206 S372 214 470 120';  // accused
  return (
    <figure className="replay" aria-label="Animated example of a staff replay">
      <div className="replay-bar">
        <span className="rec"><i /> Case 1042</span>
        <span className="muted">Shots fired · 45 second window</span>
      </div>
      <svg ref={ref} viewBox="0 0 560 380" role="img" aria-label="Two players on a map, one chasing the other, with a timeline below">
        <defs>
          <path id="pA" d={A} pathLength="1" /><path id="pB" d={B} pathLength="1" />
          <radialGradient id="glow"><stop offset="0" stopColor="#ff5a5f" stopOpacity=".55" /><stop offset="1" stopColor="#ff5a5f" stopOpacity="0" /></radialGradient>
        </defs>
        <g className="streets" fill="none">
          {[40, 120, 200, 280].map((y) => <path key={y} d={`M0 ${y} H560`} />)}
          {[70, 170, 270, 370, 470].map((x) => <path key={x} d={`M${x} 0 V330`} />)}
          <path className="main" d="M0 330 L200 214 L560 60" />
        </g>
        <g className="blocks">
          <rect x="84" y="52" width="76" height="56" rx="6" /><rect x="284" y="52" width="76" height="56" rx="6" />
          <rect x="384" y="132" width="76" height="56" rx="6" /><rect x="84" y="212" width="76" height="56" rx="6" />
          <rect x="184" y="132" width="66" height="50" rx="6" /><rect x="384" y="212" width="76" height="56" rx="6" />
        </g>
        <path d={A} pathLength="1" className="trail a" />
        <path d={B} pathLength="1" className="trail b" />
        <g>
          <circle cx="253" cy="210" r="34" fill="url(#glow)" opacity="0">
            <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;.40;.46;.58;.66;1" />
          </circle>
        </g>
        <g className="dot a"><circle r="8" /><circle r="14" className="halo" /><animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#pA" /></animateMotion></g>
        <g className="dot b"><circle r="8" /><circle r="14" className="halo" /><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#pB" /></animateMotion></g>
        <g className="tag"><text x="22" y="334">Reporter</text><rect x="8" y="326" width="8" height="8" rx="4" className="ra" /><text x="102" y="334">Accused</text><rect x="88" y="326" width="8" height="8" rx="4" className="rb" /></g>
        <g className="note">
          <g opacity="0"><rect x="272" y="142" width="150" height="26" rx="7" /><text x="284" y="159">Closest approach 1.4 m</text>
            <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;.42;.48;.62;.68;1" /></g>
          <g opacity="0"><rect x="372" y="128" width="104" height="26" rx="7" /><text x="384" y="145">Shots fired</text>
            <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;.70;.74;.86;.9;1" /></g>
        </g>
        <g className="timeline" transform="translate(24 352)">
          <rect width="512" height="6" rx="3" className="rail" />
          <rect width="512" height="6" rx="3" className="fill"><animate attributeName="width" dur="9s" repeatCount="indefinite" values="0;512" /></rect>
          <rect x="216" y="-5" width="3" height="16" rx="1.5" className="mark" /><rect x="357" y="-5" width="3" height="16" rx="1.5" className="mark hit" />
          <circle cy="3" r="7" className="head"><animate attributeName="cx" dur="9s" repeatCount="indefinite" values="0;512" /></circle>
        </g>
      </svg>
    </figure>
  );
}
