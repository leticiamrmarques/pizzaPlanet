// Middlewares de autenticação e autorização por role
// Verifica sessão e permissões antes de processar qualquer requisição
// SEGURANÇA: Todas as rotas de API retornam JSON. Rotas de página redirecionam

const { getSession } = require('../config/session');
const { sendJSON } = require('../utils/http');

// Detecta se a requisição é para a API (espera JSON) ou para uma página (espera redirect).
function isApiRequest(req) {
  return req.url.startsWith('/api/');
}

function naoAutenticado(req, res) {
  if (isApiRequest(req)) return sendJSON(res, 401, { erro: 'Não autenticado.' });
  res.writeHead(302, { Location: '/home?erro=nao_autenticado' });
  res.end();
}

function semPermissao(req, res) {
  if (isApiRequest(req)) return sendJSON(res, 403, { erro: 'Sem permissão.' });
  res.writeHead(302, { Location: '/home?erro=sem_permissao' });
  res.end();
}

// Verifica se existe sessão ativa e retorna a sessão ou null.
function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) { naoAutenticado(req, res); return null; }
  return session;
}

// Requer perfil 'funcionario' com uma das roles especificadas.
// roles: string ou string[]
function requireRole(req, res, roles) {
  const session = requireAuth(req, res);
  if (!session) return null;

  if (session.perfil !== 'funcionario') {
    semPermissao(req, res); return null;
  }

  const required = Array.isArray(roles) ? roles : [roles];
  const hasRole = required.some(r => (session.roles || []).includes(r));
  if (!hasRole) { semPermissao(req, res); return null; }

  return session;
}

// Requer perfil 'cliente'
function requireCliente(req, res) {
  const session = requireAuth(req, res);
  if (!session) return null;
  if (session.perfil !== 'cliente') { semPermissao(req, res); return null; }
  return session;
}

// Requer perfil 'entregador'
function requireEntregador(req, res) {
  const session = requireAuth(req, res);
  if (!session) return null;
  if (session.perfil !== 'entregador') { semPermissao(req, res); return null; }
  return session;
}

// Verifica ownership: cliente só acessa seus próprios recursos
// Admins passam livremente
function requireOwnerOrAdmin(req, res, clienteId) {
  const session = requireAuth(req, res);
  if (!session) return null;

  const isAdmin = session.perfil === 'funcionario' && (session.roles || []).includes('admin');
  const isOwner = session.perfil === 'cliente' && session.clienteId === Number(clienteId);

  if (!isAdmin && !isOwner) { semPermissao(req, res); return null; }
  return session;
}

module.exports = { requireAuth, requireRole, requireCliente, requireEntregador, requireOwnerOrAdmin };
