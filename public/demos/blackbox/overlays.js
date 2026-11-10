'use strict';
// Things that appear on screen without the window being open: toasts, prompts, staff alerts, the panic ring and warnings

HANDLERS.toast = d => toast(d.message, d.kind);

// ---- "press Y" prompts (witness question, killer report, rating)
let promptTimer = null;
HANDLERS.prompt = d => {
  const p = d.p, box = $('#prompt');
  let icon = 'eye', title = '', text = '';
  if (p.kind === 'witness') {
    title = 'Were you a witness?';
    text = `A report was filed near you: ${p.label}. Tell staff what you saw.${p.reward ? ` You get ${S.settings.currency || '$'}${p.reward} for a statement.` : ''}`;
  } else if (p.kind === 'death') {
    icon = 'crosshair';
    title = `${p.name} killed you`;
    text = `Report them for it? The last minute is attached for you.${p.weapon ? ` (${p.weapon})` : ''}`;
  } else if (p.kind === 'rate') {
    icon = 'star';
    title = `How did staff handle report #${p.case}?`;
    text = 'It takes two seconds and helps us improve.';
  }
  box.innerHTML = `<div class="prompt-card"><div class="prompt-ico">${ico(icon, 22)}</div><div class="grow"><b>${esc(title)}</b><p>${esc(text)}</p></div><kbd>Y</kbd><i class="prompt-bar" style="animation-duration:${d.secs}s"></i></div>`;
  box.classList.remove('hidden');
  clearTimeout(promptTimer);
  promptTimer = setTimeout(() => box.classList.add('hidden'), d.secs * 1000);
};
HANDLERS.promptClear = () => { clearTimeout(promptTimer); $('#prompt').classList.add('hidden'); };

// ---- new case alerts for staff on duty
HANDLERS.alert = d => {
  const c = d.case, box = $('#alerts');
  const el = document.createElement('div');
  el.className = 'alert-card' + (d.escalated ? ' esc' : '');
  el.innerHTML = `<div class="al-top">${bandBadge(c.band)}<b>${d.escalated ? 'Needs attention' : 'New report'} #${c.id}</b>${c.panic ? pill('URGENT', 'war') : ''}</div>
    <div class="al-body">${catChip(c.category)} <span>${esc(c.target ? c.target : c.title)}</span></div><small>${d.escalated ? 'Nobody has picked this up yet.' : 'Open the staff desk to take it.'}</small>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 8000);
  setTimeout(() => el.remove(), 8600);
};

// ---- the hold-to-report ring
HANDLERS.panic = d => {
  const box = $('#panic');
  if (!d.on) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.innerHTML = `<svg viewBox="0 0 80 80" width="96" height="96"><circle cx="40" cy="40" r="34" class="pr-bg"/><circle cx="40" cy="40" r="34" class="pr-fg" style="animation-duration:${d.ms}ms"/></svg><b>Hold to send an urgent report</b>`;
  box.classList.remove('hidden');
};

// ---- a warning from staff
let warnTimer = null;
HANDLERS.warned = d => {
  const box = $('#warned');
  box.innerHTML = `<div class="warn-card">${ico('siren', 24)}<div><b>Warning from staff</b><p>${esc(d.reason || '')}</p></div></div>`;
  box.classList.remove('hidden');
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => box.classList.add('hidden'), 12000);
};
