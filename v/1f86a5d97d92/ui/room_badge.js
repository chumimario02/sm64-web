// Room badge: a small label at the top of the screen with the room's name, how many
// players are in it, and a button that copies the invite link.
// The count comes from the census (net/census.js), which counts the players of the
// whole world (room), not just the ones at the same star. It refreshes every few
// seconds, because delegates only report now and then.

const LABELS = { normal: 'Normal', speedrun: 'Speedrun', hangout: 'Hangout' };
const REFRESH_MS = 2000;

const STYLE = `
  #room-badge { position: fixed; z-index: 6; left: 50%; transform: translateX(-50%);
    top: calc(env(safe-area-inset-top, 0px) + 8px); display: flex; align-items: center; gap: 8px;
    padding: 5px 6px 5px 12px; border-radius: 999px; background: rgba(11, 11, 16, .72); color: #e8e8ee;
    font: 600 13px system-ui, sans-serif; pointer-events: none; white-space: nowrap; max-width: 92vw; }
  #room-badge .count { color: #9a9aa8; font-weight: 500; }
  #room-badge button { pointer-events: auto; font: 600 12px system-ui, sans-serif; padding: 5px 10px; border-radius: 999px;
    border: 0; background: #e4382b; color: #fff; cursor: pointer; }
  body.coop-panel #room-badge { display: none; }
`;

const plural = count => `${count} ${count === 1 ? 'jugador' : 'jugadores'}`;

// room: the room name (?room=); census: () => the census, or null until connected
export function startRoomBadge({ room, census }) {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const label = LABELS[room] ?? `Privada ${room.toUpperCase()}`;
  const root = document.createElement('div');
  root.id = 'room-badge';
  const name = document.createElement('span');
  name.textContent = label;
  const count = document.createElement('span');
  count.className = 'count';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.tabIndex = -1; // keep the game's keys from pressing it
  copy.textContent = 'Copiar enlace';
  root.append(name, count, copy);
  document.body.appendChild(root);

  const refresh = () => {
    let total = null;
    try { total = census()?.total() ?? null; } catch {}
    count.textContent = total === null ? '' : `· ${plural(total)}`;
  };
  refresh();
  setInterval(refresh, REFRESH_MS);

  copy.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('room', room);
    try {
      await navigator.clipboard.writeText(url.toString());
      copy.textContent = '¡Copiado!';
    } catch {
      copy.textContent = 'No se pudo copiar';
    }
    setTimeout(() => { copy.textContent = 'Copiar enlace'; }, 1500);
    document.getElementById('canvas')?.focus(); // give the keyboard back to the game
  });
}
