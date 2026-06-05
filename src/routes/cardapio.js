// Cardápio, carrinho de compras e finalização de pedido

const ctrl = require('../controllers/cardapioController');
const { methodNotAllowed, sendJSON } = require('../utils/http');

async function cardapioRouter(req, res, pathname) {
  try {
    // GET /api/cardapio  — público
    if (pathname === '/api/cardapio' && req.method === 'GET') {
      return await ctrl.getCardapio(req, res);
    }

    // GET /api/cardapio/admin  — funcionário
    if (pathname === '/api/cardapio/admin' && req.method === 'GET') {
      return await ctrl.getCardapioAdmin(req, res);
    }

    // PUT /api/cardapio/tamanho/:id
    const tamanhoMatch = pathname.match(/^\/api\/cardapio\/tamanho\/(\d+)$/);
    if (tamanhoMatch) {
      if (req.method === 'PUT') return await ctrl.updateTamanho(req, res, tamanhoMatch[1]);
      return methodNotAllowed(res);
    }

    // POST /api/cardapio/sabor  PUT /api/cardapio/sabor/:id
    const saborMatch = pathname.match(/^\/api\/cardapio\/sabor(?:\/(\d+))?$/);
    if (saborMatch) {
      if (req.method === 'POST' && !saborMatch[1]) return await ctrl.createSabor(req, res);
      if (req.method === 'PUT' && saborMatch[1]) return await ctrl.updateSabor(req, res, saborMatch[1]);
      return methodNotAllowed(res);
    }

    // PUT /api/cardapio/borda/:id
    const bordaMatch = pathname.match(/^\/api\/cardapio\/borda\/(\d+)$/);
    if (bordaMatch) {
      if (req.method === 'PUT') return await ctrl.updateBorda(req, res, bordaMatch[1]);
      return methodNotAllowed(res);
    }

    // PUT /api/cardapio/bebida/:id/disponivel
    const bebidaDispMatch = pathname.match(/^\/api\/cardapio\/bebida\/(\d+)\/disponivel$/);
    if (bebidaDispMatch) {
      if (req.method === 'PUT') return await ctrl.updateBebidaDisponivel(req, res, bebidaDispMatch[1]);
      return methodNotAllowed(res);
    }

    // PUT /api/cardapio/bebida-volume/:id/preco
    const bebidaPrecoMatch = pathname.match(/^\/api\/cardapio\/bebida-volume\/(\d+)\/preco$/);
    if (bebidaPrecoMatch) {
      if (req.method === 'PUT') return await ctrl.updateBebidaPreco(req, res, bebidaPrecoMatch[1]);
      return methodNotAllowed(res);
    }

    return false;
  } catch (err) {
    console.error('[cardapioRouter]', err);
    sendJSON(res, 500, { erro: 'Erro interno.' });
  }
}

module.exports = cardapioRouter;
