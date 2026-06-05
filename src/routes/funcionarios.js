// Rotas de cadastro e edição de funcionários

const ctrl = require('../controllers/funcionarioController');
const { methodNotAllowed, sendJSON } = require('../utils/http');

async function funcionariosRouter(req, res, pathname) {
  try {
    if (pathname === '/api/funcionarios') {
      if (req.method === 'GET') return await ctrl.listar(req, res);
      if (req.method === 'POST') return await ctrl.criar(req, res);
      return methodNotAllowed(res);
    }

    const match = pathname.match(/^\/api\/funcionarios\/(\d+)$/);
    if (match) {
      const id = match[1];
      if (req.method === 'GET') return await ctrl.detalhar(req, res, id);
      if (req.method === 'PUT') return await ctrl.atualizar(req, res, id);
      return methodNotAllowed(res);
    }

    return false;
  } catch (err) {
    console.error('[funcionariosRouter]', err);
    sendJSON(res, 500, { erro: 'Erro interno.' });
  }
}

module.exports = funcionariosRouter;
