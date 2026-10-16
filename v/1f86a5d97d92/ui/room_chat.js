// Room-wide text chat UI. Press T (or the touch 💬 button) to open the input;
// Enter sends, Escape closes. Messages show in a small log (bottom-left).
// Keys stay out of the game while open.

const MAX_VISIBLE = 12;
const FADE_MS = 12000;

const STYLE = `
  #room-chat { pointer-events: none; position: fixed; left: 12px; bottom: 12px; z-index: 15;
    width: min(360px, calc(100vw - 24px)); font: 13px system-ui, sans-serif; color: #fff;
    display: flex; flex-direction: column; gap: 6px; }
  #room-chat .log { display: flex; flex-direction: column; gap: 3px; max-height: 40vh; overflow: hidden; }
  #room-chat .line { padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.45);
    border: 1px solid rgba(255,255,255,.12); word-break: break-word;
    animation: room-chat-in .15s ease-out; transition: opacity .4s; }
  #room-chat .line.self { border-color: rgba(110,224,138,.35); }
  #room-chat .line .who { font-weight: 700; margin-right: 6px; color: #9ad0ff; }
  #room-chat .line.self .who { color: #6ee08a; }
  #room-chat .line.fading { opacity: 0; }
  #room-chat .composer { pointer-events: auto; display: none; align-items: center; gap: 6px;
    padding: 6px 8px; border-radius: 10px; background: rgba(18,18,28,.92);
    border: 1px solid rgba(255,255,255,.22); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  #room-chat.open .composer { display: flex; }
  #room-chat .composer label { flex: none; font: 600 12px system-ui, sans-serif; color: rgba(255,255,255,.65); }
  #room-chat .composer input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent;
    color: #fff; font: 14px system-ui, sans-serif; padding: 4px 0; }
  #room-chat .composer input::placeholder { color: rgba(255,255,255,.4); }
  @keyframes room-chat-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;

export function startRoomChat({ chat, name }) {
  if (!chat) return;

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'room-chat';
  root.innerHTML = `
    <div class="log" aria-live="polite"></div>
    <div class="composer">
      <label>Sala</label>
      <input type="text" maxlength="200" autocomplete="off" spellcheck="true" placeholder="Mensaje a toda la sala…" />
    </div>`;
  document.body.appendChild(root);

  const log = root.querySelector('.log');
  const input = root.querySelector('input');
  let open = false;

  const setOpen = (value) => {
    open = value;
    root.classList.toggle('open', open);
    if (open) {
      input.value = '';
      // next frame so the element is visible before focus
      requestAnimationFrame(() => input.focus());
    } else {
      input.blur();
    }
  };

  const addLine = ({ name: who, message, self }) => {
    const line = document.createElement('div');
    line.className = self ? 'line self' : 'line';
    const whoEl = document.createElement('span');
    whoEl.className = 'who';
    whoEl.textContent = who || 'Jugador';
    line.append(whoEl, document.createTextNode(message));
    log.appendChild(line);
    while (log.children.length > MAX_VISIBLE) log.firstChild.remove();
    setTimeout(() => line.classList.add('fading'), FADE_MS);
    setTimeout(() => line.remove(), FADE_MS + 500);
  };

  chat.onMessage(addLine);

  // Touch controls (and anything else) can open the composer with this event
  addEventListener('sm64-open-room-chat', () => setOpen(true));

  // T opens; while open, keys stay out of the game
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (open) {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const text = input.value;
        if (chat.send(name, text)) input.value = '';
        setOpen(false);
      }
      return;
    }
    // do not steal T while typing in another field or with modifiers
    if (e.key !== 't' && e.key !== 'T') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, true);

  input.addEventListener('keydown', (e) => e.stopPropagation());
  input.addEventListener('keyup', (e) => e.stopPropagation());
  input.addEventListener('keypress', (e) => e.stopPropagation());
}
