// Queries do cardápio: pizzas, tamanhos, sabores, bordas e bebidas

const db = require('../config/db');

// ====== Tamanhos ========
async function getTamanhos(somenteDisponiveis = true) {
  const sql = somenteDisponiveis
    ? 'SELECT * FROM pizza_tamanho WHERE disponivel = TRUE ORDER BY preco'
    : 'SELECT * FROM pizza_tamanho ORDER BY preco';
  const [rows] = await db.query(sql);
  return rows;
}

async function updateTamanho(id, data) {
  const { preco, disponivel } = data;
  await db.query(
    'UPDATE pizza_tamanho SET preco = ?, disponivel = ? WHERE id = ?',
    [preco, disponivel, id]
  );
}

// ====== Sabores ========
async function getSabores(somenteDisponiveis = true) {
  const sql = somenteDisponiveis
    ? "SELECT * FROM pizza_sabor WHERE disponivel = TRUE ORDER BY categoria, nome"
    : 'SELECT * FROM pizza_sabor ORDER BY categoria, nome';
  const [rows] = await db.query(sql);
  return rows;
}

async function updateSabor(id, data) {
  const { nome, categoria, descricao, disponivel } = data;
  await db.query(
    'UPDATE pizza_sabor SET nome = ?, categoria = ?, descricao = ?, disponivel = ? WHERE id = ?',
    [nome, categoria, descricao || null, disponivel, id]
  );
}

async function createSabor(data) {
  const { nome, categoria, descricao } = data;
  const [result] = await db.query(
    'INSERT INTO pizza_sabor (nome, categoria, descricao) VALUES (?, ?, ?)',
    [nome, categoria, descricao || null]
  );
  return result.insertId;
}

// ====== Bordas ========
async function getBordas(somenteDisponiveis = true) {
  const sql = somenteDisponiveis
    ? 'SELECT * FROM pizza_borda WHERE disponivel = TRUE ORDER BY preco'
    : 'SELECT * FROM pizza_borda ORDER BY preco';
  const [rows] = await db.query(sql);
  return rows;
}

async function updateBorda(id, data) {
  const { nome, preco, disponivel } = data;
  await db.query(
    'UPDATE pizza_borda SET nome = ?, preco = ?, disponivel = ? WHERE id = ?',
    [nome, preco, disponivel, id]
  );
}

//  ====== Bebidas ========
async function getBebidasDisponiveis() {
  const [rows] = await db.query(`
    SELECT bd.id AS disponivel_id, bt.nome AS tipo,
      bs.id AS sabor_id, bs.nome AS sabor,
      bv.id AS volume_id, bv.volume_ml, bv.preco
    FROM bebida_disponivel bd
    JOIN bebida_sabor bs ON bs.id = bd.sabor_id
    JOIN bebida_volume bv ON bv.id = bd.volume_id
    JOIN bebida_tipo bt ON bt.id = bs.bebida_tipo_id
    WHERE bd.disponivel = TRUE
    ORDER BY bt.nome, bs.nome, bv.volume_ml
  `);
  return rows;
}

async function getBebidasAdmin() {
  const [rows] = await db.query(`
    SELECT bd.id AS disponivel_id, bd.disponivel, bt.nome AS tipo,
      bs.id AS sabor_id, bs.nome AS sabor,
      bv.id AS volume_id, bv.volume_ml, bv.preco
    FROM bebida_disponivel bd
    JOIN bebida_sabor bs ON bs.id = bd.sabor_id
    JOIN bebida_volume bv ON bv.id = bd.volume_id
    JOIN bebida_tipo bt ON bt.id = bs.bebida_tipo_id
    ORDER BY bt.nome, bs.nome, bv.volume_ml
  `);
  return rows;
}

async function updateBebidaDisponivel(id, disponivel) {
  await db.query('UPDATE bebida_disponivel SET disponivel = ? WHERE id = ?', [disponivel, id]);
}

async function updateBebidaPreco(volumeId, preco) {
  await db.query('UPDATE bebida_volume SET preco = ? WHERE id = ?', [preco, volumeId]);
}

module.exports = {
  getTamanhos, updateTamanho,
  getSabores, updateSabor, createSabor,
  getBordas, updateBorda,
  getBebidasDisponiveis, getBebidasAdmin, updateBebidaDisponivel, updateBebidaPreco,
};
