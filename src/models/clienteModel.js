// Queries de clientes, endereços, formas de pagamento e entregadores
// Proteção contra SQL Injection

const db = require('../config/db');

//  ====== Clientes ========
async function getClientes() {
  const [rows] = await db.query(`
    SELECT p.id AS pessoa_id, p.cpf, p.nome, p.email, p.telefone, p.ativo, c.id AS cliente_id
    FROM cliente c JOIN pessoa p ON p.id = c.pessoa_id
    ORDER BY p.nome
  `);
  return rows;
}

async function getClienteById(clienteId) {
  const [[row]] = await db.query(`
    SELECT p.*, c.id AS cliente_id
    FROM cliente c JOIN pessoa p ON p.id = c.pessoa_id
    WHERE c.id = ?
  `, [clienteId]);
  return row || null;
}

async function updateCliente(pessoaId, data) {
  const { nome, email, telefone, ativo } = data;
  await db.query(
    'UPDATE pessoa SET nome = ?, email = ?, telefone = ?, ativo = ? WHERE id = ?',
    [nome, email, telefone || null, ativo, pessoaId]
  );
}

//  ====== Endereços ========
async function getEnderecos(clienteId) {
  const [rows] = await db.query(
    'SELECT * FROM cliente_endereco WHERE cliente_id = ? ORDER BY principal DESC',
    [clienteId]
  );
  return rows;
}

async function createEndereco(clienteId, data) {
  const { cep, logradouro, numero, complemento, bairro, cidade, estado, ponto_referencia, principal } = data;
  const [res] = await db.query(
    `INSERT INTO cliente_endereco (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado, ponto_referencia, principal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [clienteId, cep, logradouro, numero, complemento || null, bairro, cidade, estado, ponto_referencia || null, principal ? 1 : 0]
  );
  if (principal) {
    await db.query('UPDATE cliente_endereco SET principal = FALSE WHERE cliente_id = ? AND id <> ?', [clienteId, res.insertId]);
  }
  return res.insertId;
}

async function updateEndereco(id, clienteId, data) {
  const { cep, logradouro, numero, complemento, bairro, cidade, estado, ponto_referencia, principal } = data;
  await db.query(
    `UPDATE cliente_endereco SET cep=?, logradouro=?, numero=?, complemento=?, bairro=?, cidade=?, estado=?, ponto_referencia=?, principal=?
     WHERE id = ? AND cliente_id = ?`,
    [cep, logradouro, numero, complemento || null, bairro, cidade, estado, ponto_referencia || null, principal ? 1 : 0, id, clienteId]
  );
  if (principal) {
    await db.query('UPDATE cliente_endereco SET principal = FALSE WHERE cliente_id = ? AND id <> ?', [clienteId, id]);
  }
}

//  ====== Formas de pagamento ========
async function getFormasPagamento(clienteId) {
  const [rows] = await db.query(
    'SELECT * FROM cliente_forma_pagamento WHERE cliente_id = ? ORDER BY principal DESC',
    [clienteId]
  );
  return rows;
}

async function createFormaPagamento(clienteId, data) {
  const { tipo, bandeira, ultimos_digitos, chave_pix, principal } = data;
  const [res] = await db.query(
    `INSERT INTO cliente_forma_pagamento (cliente_id, tipo, bandeira, ultimos_digitos, chave_pix, principal)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [clienteId, tipo, bandeira || null, ultimos_digitos || null, chave_pix || null, principal ? 1 : 0]
  );
  if (principal) {
    await db.query('UPDATE cliente_forma_pagamento SET principal = FALSE WHERE cliente_id = ? AND id <> ?', [clienteId, res.insertId]);
  }
  return res.insertId;
}

//  ====== Entregadores ========
async function getEntregadores(somenteAtivos = true) {
  const sql = somenteAtivos
    ? `SELECT p.id AS pessoa_id, p.nome, p.email, p.telefone, e.id AS entregador_id, e.cnh, e.placa_veiculo, e.ativo
       FROM entregador e JOIN pessoa p ON p.id = e.pessoa_id WHERE e.ativo = TRUE ORDER BY p.nome`
    : `SELECT p.id AS pessoa_id, p.nome, p.email, p.telefone, e.id AS entregador_id, e.cnh, e.placa_veiculo, e.ativo
       FROM entregador e JOIN pessoa p ON p.id = e.pessoa_id ORDER BY p.nome`;
  const [rows] = await db.query(sql);
  return rows;
}

async function getEntregadorById(entregadorId) {
  const [[row]] = await db.query(`
    SELECT p.*, e.id AS entregador_id, e.cnh, e.placa_veiculo, e.ativo AS entregador_ativo
    FROM entregador e JOIN pessoa p ON p.id = e.pessoa_id WHERE e.id = ?
  `, [entregadorId]);
  return row || null;
}

async function createEntregador(pessoaId, data) {
  const { cnh, placa_veiculo } = data;
  const [res] = await db.query(
    'INSERT INTO entregador (pessoa_id, cnh, placa_veiculo) VALUES (?, ?, ?)',
    [pessoaId, cnh, placa_veiculo]
  );
  return res.insertId;
}

async function updateEntregador(entregadorId, data) {
  const { cnh, placa_veiculo, ativo } = data;
  await db.query(
    'UPDATE entregador SET cnh = ?, placa_veiculo = ?, ativo = ? WHERE id = ?',
    [cnh, placa_veiculo, ativo, entregadorId]
  );
}

async function deleteEndereco(id, clienteId) {
  await db.query('DELETE FROM cliente_endereco WHERE id = ? AND cliente_id = ?', [id, clienteId]);
}

module.exports = {
  getClientes, getClienteById, updateCliente,
  getEnderecos, createEndereco, updateEndereco, deleteEndereco,
  getFormasPagamento, createFormaPagamento,
  getEntregadores, getEntregadorById, createEntregador, updateEntregador,
};
