// Room-wide text chat over the META channel (whole ?room= world).
// Payload is a short JSON string: {"n":"name","m":"message"}.
import { META } from './meta_channel.js';

const MAX_MESSAGE = 200;
const MAX_NAME = 32;
const MIN_SEND_MS = 400; // soft client rate limit

export class RoomChat {
  constructor(meta) {
    this.meta = meta;
    this.listeners = new Set();
    this.lastSend = 0;
    meta.on(META.CHAT, (text, from) => this.heard(text, from));
  }

  onMessage(listener) { this.listeners.add(listener); }

  // Broadcast to everyone in the same room/world
  send(name, message) {
    const now = Date.now();
    if (now - this.lastSend < MIN_SEND_MS) return false;
    const m = String(message ?? '').trim().slice(0, MAX_MESSAGE);
    if (!m) return false;
    const n = String(name ?? 'Jugador').slice(0, MAX_NAME);
    this.lastSend = now;
    this.meta.send(META.CHAT, JSON.stringify({ n, m }));
    // Echo locally so the sender sees it even if meta does not loop back
    this.emit({ name: n, message: m, from: null, self: true, at: now });
    return true;
  }

  heard(text, from) {
    let entry;
    try { entry = JSON.parse(text); } catch { return; }
    const name = String(entry?.n ?? '').slice(0, MAX_NAME) || 'Jugador';
    const message = String(entry?.m ?? '').trim().slice(0, MAX_MESSAGE);
    if (!message) return;
    this.emit({ name, message, from, self: false, at: Date.now() });
  }

  emit(msg) {
    this.listeners.forEach(listener => {
      try { listener(msg); } catch (e) { console.warn('room chat listener:', e); }
    });
  }
}
