// Gerenciamento de sessão em memória via cookie HttpOnly

const crypto = require('crypto');

const sessions = new Map();

const SESSION_COOKIE = 'pizzaria_sid';
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas de inatividade

// Limpeza periódica de sessões expiradas (a cada 30 min)
setInterval(() => {
  const agora = Date.now();
  for (const [sid, data] of sessions.entries()) {
    if (agora - data._ultimoAcesso > SESSION_TTL_MS) {
      sessions.delete(sid);
    }
  }
}, 30 * 60 * 1000);

function generateId() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(data) {
  const sid = generateId();
  sessions.set(sid, { ...data, _criado: Date.now(), _ultimoAcesso: Date.now() });
  return sid;
}

function getSession(req) {
  const cookie = parseCookies(req)[SESSION_COOKIE];
  if (!cookie) return null;
  const session = sessions.get(cookie);
  if (!session) return null;
  // Verificar TTL por inatividade
  if (Date.now() - session._ultimoAcesso > SESSION_TTL_MS) {
    sessions.delete(cookie);
    return null;
  }
  // Renovar timestamp de último acesso (sliding session)
  session._ultimoAcesso = Date.now();
  return session;
}

function destroySession(req) {
  const cookie = parseCookies(req)[SESSION_COOKIE];
  if (cookie) sessions.delete(cookie);
}

function parseCookies(req) {
  const list = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    if (key) list[key.trim()] = decodeURIComponent(rest.join('='));
  });
  return list;
}

function setCookieHeader(sid) {
  // HttpOnly: inacessível por JS do cliente
  // SameSite=Strict: proteção contra CSRF
  // Adicionar "; Secure" ao fazer deploy em HTTPS
  return `${SESSION_COOKIE}=${sid}; HttpOnly; Path=/; SameSite=Strict`;
}

function clearCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}

module.exports = {
  createSession,
  getSession,
  destroySession,
  setCookieHeader,
  clearCookieHeader,
  SESSION_COOKIE,
};
