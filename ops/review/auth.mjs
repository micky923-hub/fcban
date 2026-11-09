// 운영자 인증 (SB-11 보안): 계정 1개, scrypt 비밀번호, 세션 12시간, CSRF 토큰, 접속 주소 제한.
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_MS = 12 * 60 * 60 * 1000;

/** 'scrypt$<salt hex>$<hash hex>' */
export function hashPassword(password, salt = randomBytes(16)) {
  const h = scryptSync(String(password), salt, 32);
  return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const m = /^scrypt\$([0-9a-f]+)\$([0-9a-f]{64})$/.exec(String(stored || ''));
  if (!m) return false;
  const expect = Buffer.from(m[2], 'hex');
  const got = scryptSync(String(password), Buffer.from(m[1], 'hex'), 32);
  return timingSafeEqual(expect, got);
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** 루프백 또는 Tailscale 대역(100.64.0.0/10, fd7a:115c:a1e0::/48)만 */
export function isAllowedRemote(addr) {
  const a = String(addr || '').replace(/^::ffff:/, '');
  if (a === '127.0.0.1' || a === '::1') return true;
  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(a);
  if (v4) {
    const o1 = Number(v4[1]);
    const o2 = Number(v4[2]);
    return o1 === 100 && o2 >= 64 && o2 <= 127;
  }
  return /^fd7a:115c:a1e0:/i.test(a);
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* 깨진 쿠키 무시 */ }
    }
  }
  return out;
}

/** 메모리 세션 저장소(서버를 다시 켜면 모두 로그아웃). 만료는 로그인 시점부터 12시간 고정 */
export function createSessions({ now = () => Date.now() } = {}) {
  const map = new Map();
  return {
    create(user) {
      const s = { id: randomBytes(32).toString('hex'), user, csrf: randomBytes(24).toString('hex'), expires: now() + SESSION_MS };
      map.set(s.id, s);
      return s;
    },
    get(id) {
      const s = id ? map.get(id) : null;
      if (!s) return null;
      if (s.expires <= now()) { map.delete(id); return null; }
      return s;
    },
    destroy(id) { map.delete(id); },
  };
}

/** 로그인 실패 제한: 주소별 15분에 5회 */
export function createLimiter({ max = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const hits = new Map();
  const recent = (key) => (hits.get(key) || []).filter((t) => now() - t < windowMs);
  return {
    blocked(key) { return recent(key).length >= max; },
    fail(key) { hits.set(key, [...recent(key), now()]); },
    reset(key) { hits.delete(key); },
  };
}
