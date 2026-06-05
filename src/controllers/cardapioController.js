// Leitura pública do cardápio + gestão pelo funcionário

const m = require('../models/cardapioModel');
const { sendJSON, parseBody } = require('../utils/http');
const { requireRole } = require('../middlewares/auth');

// ====== Público ======
async function getCardapio(req, res) {
  const [tamanhos, sabores, bordas, bebidas] = await Promise.all([
    m.getTamanhos(true),
    m.getSabores(true),
    m.getBordas(true),
    m.getBebidasDisponiveis(),
  ]);
  sendJSON(res, 200, { tamanhos, sabores, bordas, bebidas });
}

// ====== Admin ======
async function getCardapioAdmin(req, res) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;

  const [tamanhos, sabores, bordas, bebidas] = await Promise.all([
    m.getTamanhos(false),
    m.getSabores(false),
    m.getBordas(false),
    m.getBebidasAdmin(),
  ]);
  sendJSON(res, 200, { tamanhos, sabores, bordas, bebidas });
}

async function updateTamanho(req, res, id) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateTamanho(id, body);
  sendJSON(res, 200, { ok: true });
}

async function updateSabor(req, res, id) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateSabor(id, body);
  sendJSON(res, 200, { ok: true });
}

async function createSabor(req, res) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  const id = await m.createSabor(body);
  sendJSON(res, 201, { ok: true, id });
}

async function updateBorda(req, res, id) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateBorda(id, body);
  sendJSON(res, 200, { ok: true });
}

async function updateBebidaDisponivel(req, res, id) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateBebidaDisponivel(id, body.disponivel);
  sendJSON(res, 200, { ok: true });
}

async function updateBebidaPreco(req, res, volumeId) {
  const session = requireRole(req, res, ['cardapio', 'admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateBebidaPreco(volumeId, body.preco);
  sendJSON(res, 200, { ok: true });
}

module.exports = {
  getCardapio, getCardapioAdmin,
  updateTamanho, updateSabor, createSabor, updateBorda,
  updateBebidaDisponivel, updateBebidaPreco,
};
