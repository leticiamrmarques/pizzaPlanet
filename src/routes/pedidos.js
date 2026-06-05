// Rotas de criação, listagem, detalhamento e atualização de status de pedidos

const ctrl = require('../controllers/pedidoController');
const { methodNotAllowed, sendJSON } = require('../utils/http');

async function pedidosRouter(req, res, pathname) {
  try {
    // GET /api/pedidos  POST /api/pedidos
    if (pathname === '/api/pedidos') {
      if (req.method === 'GET') return await ctrl.listarPedidos(req, res);
      if (req.method === 'POST') return await ctrl.criarPedido(req, res);
      return methodNotAllowed(res);
    }

    // GET /api/pedidos/entregadores
    if (pathname === '/api/pedidos/entregadores' && req.method === 'GET') {
      return await ctrl.getEntregadoresDisponiveis(req, res);
    }

    // GET /api/pedidos/:id  PUT /api/pedidos/:id/status
    const pedidoMatch = pathname.match(/^\/api\/pedidos\/(\d+)(\/status)?$/);
    if (pedidoMatch) {
      const id = pedidoMatch[1];
      if (!pedidoMatch[2] && req.method === 'GET') return await ctrl.detalharPedido(req, res, id);
      if (pedidoMatch[2] && req.method === 'PUT') return await ctrl.atualizarStatus(req, res, id);
      return methodNotAllowed(res);
    }

    return false;
  } catch (err) {
    console.error('[pedidosRouter]', err);
    sendJSON(res, 500, { erro: 'Erro interno.' });
  }
}

module.exports = pedidosRouter;
