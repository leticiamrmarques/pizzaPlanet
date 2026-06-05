// Rotas de clientes, endereços, formas de pagamento e entregadores

const ctrl = require('../controllers/clienteController');
const { methodNotAllowed, sendJSON } = require('../utils/http');

async function clientesRouter(req, res, pathname) {
  try {
    // GET /api/clientes
    if (pathname === '/api/clientes') {
      if (req.method === 'GET') return await ctrl.listarClientes(req, res);
      return methodNotAllowed(res);
    }

    // GET PUT /api/clientes/:id
    const clienteMatch = pathname.match(/^\/api\/clientes\/(\d+)$/);
    if (clienteMatch) {
      const id = clienteMatch[1];
      if (req.method === 'GET') return await ctrl.detalharCliente(req, res, id);
      if (req.method === 'PUT') return await ctrl.atualizarCliente(req, res, id);
      return methodNotAllowed(res);
    }

    // GET POST /api/clientes/:id/enderecos
    const enderecoListMatch = pathname.match(/^\/api\/clientes\/(\d+)\/enderecos$/);
    if (enderecoListMatch) {
      const clienteId = enderecoListMatch[1];
      if (req.method === 'GET') return await ctrl.listarEnderecos(req, res, clienteId);
      if (req.method === 'POST') return await ctrl.criarEndereco(req, res, clienteId);
      return methodNotAllowed(res);
    }

    // PUT DELETE /api/clientes/:id/enderecos/:endId
    const enderecoMatch = pathname.match(/^\/api\/clientes\/(\d+)\/enderecos\/(\d+)$/);
    if (enderecoMatch) {
      if (req.method === 'PUT') return await ctrl.atualizarEndereco(req, res, enderecoMatch[1], enderecoMatch[2]);
      if (req.method === 'DELETE') return await ctrl.excluirEndereco(req, res, enderecoMatch[1], enderecoMatch[2]);
      return methodNotAllowed(res);
    }

    // POST /api/clientes/:id/pagamentos
    const pagamentoMatch = pathname.match(/^\/api\/clientes\/(\d+)\/pagamentos$/);
    if (pagamentoMatch) {
      if (req.method === 'POST') return await ctrl.criarFormaPagamento(req, res, pagamentoMatch[1]);
      return methodNotAllowed(res);
    }

    // GET /api/entregadores  POST /api/entregadores
    if (pathname === '/api/entregadores') {
      if (req.method === 'GET') return await ctrl.listarEntregadores(req, res);
      if (req.method === 'POST') return await ctrl.criarEntregador(req, res);
      return methodNotAllowed(res);
    }

    // PUT /api/entregadores/:id
    const entregadorMatch = pathname.match(/^\/api\/entregadores\/(\d+)$/);
    if (entregadorMatch) {
      if (req.method === 'PUT') return await ctrl.atualizarEntregador(req, res, entregadorMatch[1]);
      return methodNotAllowed(res);
    }

    return false;
  } catch (err) {
    console.error('[clientesRouter]', err);
    sendJSON(res, 500, { erro: 'Erro interno.' });
  }
}

module.exports = clientesRouter;
