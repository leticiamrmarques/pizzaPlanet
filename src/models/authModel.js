// Queries relacionadas a autenticação e pessoas

const db = require('../config/db');

async function findPessoaByLogin(login) {
  const [rows] = await db.query(
    'SELECT * FROM pessoa WHERE (login = ? OR email = ?) AND ativo = TRUE LIMIT 1',
    [login, login]
  );
  return rows[0] || null;
}

async function findPerfil(pessoaId) {
  // Descobre qual perfil a pessoa tem: cliente, funcionario ou entregador
  const [[cliente], [funcionario], [entregador]] = await Promise.all([
    db.query('SELECT id FROM cliente WHERE pessoa_id = ?', [pessoaId]),
    db.query('SELECT id FROM funcionario WHERE pessoa_id = ? AND ativo = TRUE', [pessoaId]),
    db.query('SELECT id FROM entregador WHERE pessoa_id = ? AND ativo = TRUE', [pessoaId]),
  ]);

  if (funcionario[0]) {
    const [roles] = await db.query(
      'SELECT role FROM funcionario_role WHERE funcionario_id = ?',
      [funcionario[0].id]
    );
    return {
      perfil: 'funcionario',
      funcionarioId: funcionario[0].id,
      roles: roles.map(r => r.role),
    };
  }
  if (entregador[0]) {
    return { perfil: 'entregador', entregadorId: entregador[0].id };
  }
  if (cliente[0]) {
    return { perfil: 'cliente', clienteId: cliente[0].id };
  }
  return null;
}

async function createPessoa(data) {
  const { cpf, nome, email, telefone, login, senha_hash } = data;
  const [result] = await db.query(
    `INSERT INTO pessoa (cpf, nome, email, telefone, login, senha_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cpf, nome, email, telefone || null, login, senha_hash]
  );
  return result.insertId;
}

async function createCliente(pessoaId) {
  const [result] = await db.query(
    'INSERT INTO cliente (pessoa_id) VALUES (?)',
    [pessoaId]
  );
  return result.insertId;
}

async function cpfOuEmailExiste(cpf, email, excludeId = null) {
  let sql = 'SELECT id FROM pessoa WHERE (cpf = ? OR email = ?)';
  const params = [cpf, email];
  if (excludeId) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return rows.length > 0;
}

async function getPessoaById(pessoaId) {
  const [rows] = await db.query('SELECT * FROM pessoa WHERE id = ?', [pessoaId]);
  return rows[0] || null;
}

async function updateSenha(pessoaId, senha_hash) {
  await db.query('UPDATE pessoa SET senha_hash = ? WHERE id = ?', [senha_hash, pessoaId]);
}

async function updatePessoaDados(pessoaId, data) {
  const { email, telefone } = data;
  await db.query('UPDATE pessoa SET email = ?, telefone = ? WHERE id = ?', [email, telefone || null, pessoaId]);
}

async function loginExiste(login, excludeId = null) {
  let sql = 'SELECT id FROM pessoa WHERE login = ?';
  const params = [login];
  if (excludeId) { sql += ' AND id <> ?'; params.push(excludeId); }
  const [rows] = await db.query(sql, params);
  return rows.length > 0;
}

module.exports = { findPessoaByLogin, findPerfil, createPessoa, createCliente, cpfOuEmailExiste, loginExiste, getPessoaById, updateSenha, updatePessoaDados };
