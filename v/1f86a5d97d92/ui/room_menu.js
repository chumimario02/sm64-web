// Room menu: shown after the character menu (when the URL has no ?room=) and before
// joining the shared world. Resolves with the room name that net/peer_transport.js
// receives as ?room=. Everyone in the same room name shares the same world.
//   - three public rooms: Normal ('world', the original default), Speedrun, Hangout
//   - "Crear sala": makes a random private code to share with friends
//   - "Unirse con código": enters a room by its code

const PRESETS = [
  { id: 'normal', name: 'Normal', desc: 'La sala de siempre, para jugar tranquilo.' },
  { id: 'speedrun', name: 'Speedrun', desc: 'Para correr y conseguir estrellas lo más rápido posible.' },
  { id: 'hangout', name: 'Hangout', desc: 'Para pasar el rato con otros jugadores.' },
];

// Typing a preset's name as a code joins that preset
const ALIASES = { normal: 'world' };

// No look-alike characters (0/o, 1/l/i)
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 6;
const CODE_MIN = 3;
const CODE_MAX = 24;

function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

const cleanCode = text => text.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, CODE_MAX);

const STYLE = `
  #room-menu { position: fixed; inset: 0; z-index: 10; overflow: auto; background: #0b0b10; color: #e8e8ee;
    font: 15px system-ui, sans-serif; display: flex; justify-content: center; align-items: flex-start; padding: 16px; box-sizing: border-box; }
  #room-menu [hidden] { display: none !important; }
  #room-menu .card { width: min(100%, 520px); display: flex; flex-direction: column; gap: 18px; }
  #room-menu h1 { margin: 0; font-size: 22px; }
  #room-menu .section { display: flex; flex-direction: column; gap: 8px; }
  #room-menu .section > span { color: #9a9aa8; font-size: 13px; }
  #room-menu .presets { display: flex; flex-direction: column; gap: 8px; }
  #room-menu .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  #room-menu button { font: 600 14px system-ui, sans-serif; padding: 10px 14px; border-radius: 8px; border: 1px solid #3a3a48;
    background: #16161e; color: #e8e8ee; cursor: pointer; }
  #room-menu button:hover { border-color: #e4382b; }
  #room-menu .room { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; font-size: 16px; }
  #room-menu .room small { color: #9a9aa8; font-weight: 400; font-size: 13px; }
  #room-menu .primary { background: #e4382b; border-color: #e4382b; color: #fff; }
  #room-menu input { font: 16px system-ui, sans-serif; padding: 9px 10px; border-radius: 8px; border: 1px solid #3a3a48;
    background: #16161e; color: #e8e8ee; width: 180px; max-width: 100%; box-sizing: border-box; }
  #room-menu .created { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px dashed #3a3a48; border-radius: 8px; }
  #room-menu .code { font: 700 28px ui-monospace, monospace; letter-spacing: .15em; color: #fff; }
  #room-menu .hint { color: #9a9aa8; font-size: 13px; min-height: 1.2em; }
`;

export function chooseRoom() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'room-menu';
  root.innerHTML = `
    <div class="card">
      <h1>Elige una sala</h1>
      <div class="section"><span>Salas públicas</span><div class="presets"></div></div>
      <div class="section">
        <span>Sala privada</span>
        <div class="row"><button type="button" class="create">Crear sala</button></div>
        <div class="created" hidden>
          <div class="hint">Comparte este código con tus amigos:</div>
          <div class="code"></div>
          <div class="row">
            <button type="button" class="copy-code">Copiar código</button>
            <button type="button" class="copy-link">Copiar enlace</button>
            <button type="button" class="primary enter">Entrar</button>
          </div>
        </div>
      </div>
      <div class="section">
        <span>Unirse con código</span>
        <div class="row">
          <input type="text" class="join-code" placeholder="Código" maxlength="${CODE_MAX}" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button type="button" class="primary join">Unirse</button>
        </div>
        <div class="hint join-hint"></div>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = selector => root.querySelector(selector);

  return new Promise(resolve => {
    const finish = room => {
      root.remove();
      style.remove();
      resolve(room);
    };

    PRESETS.forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'room';
      const title = document.createElement('span');
      title.textContent = preset.name;
      const desc = document.createElement('small');
      desc.textContent = preset.desc;
      button.append(title, desc);
      button.addEventListener('click', () => finish(preset.id));
      $('.presets').appendChild(button);
    });

    const copy = async (button, text) => {
      const label = button.textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '¡Copiado!';
      } catch {
        button.textContent = 'No se pudo copiar';
      }
      setTimeout(() => { button.textContent = label; }, 1500);
    };

    let code = '';
    $('.create').addEventListener('click', () => {
      code = newRoomCode();
      $('.code').textContent = code.toUpperCase();
      $('.created').hidden = false;
      $('.create').textContent = 'Crear otra sala';
    });
    $('.copy-code').addEventListener('click', event => copy(event.currentTarget, code.toUpperCase()));
    $('.copy-link').addEventListener('click', event => {
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('room', code);
      copy(event.currentTarget, url.toString());
    });
    $('.enter').addEventListener('click', () => { if (code) finish(code); });

    const join = () => {
      const typed = cleanCode($('.join-code').value);
      if (typed.length < CODE_MIN) {
        $('.join-hint').textContent = `Escribe el código de la sala (mínimo ${CODE_MIN} caracteres).`;
        return;
      }
      finish(ALIASES[typed] || typed);
    };
    $('.join').addEventListener('click', join);
    $('.join-code').addEventListener('keydown', event => { if (event.key === 'Enter') join(); });
    $('.join-code').addEventListener('input', event => {
      const clean = cleanCode(event.target.value);
      if (clean !== event.target.value) event.target.value = clean;
      $('.join-hint').textContent = '';
    });
  });
}
