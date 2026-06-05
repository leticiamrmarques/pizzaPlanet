// Queries de funcionários e roles

const db = require('../config/db');

async function getFuncionarios() {
  const [rows] = await db.query(`
    SELECT p.id AS pessoa_id, p.cpf, p.nome, p.email, p.telefone, p.ativo,
           f.id AS funcionario_id, f.cargo, f.ativo AS funcionario_ativo,
           GROUP_CONCAT(fr.role ORDER BY fr.role) AS roles
    FROM funcionario f
    JOIN pessoa p ON p.id = f.pessoa_id
    LEFT JOIN funcionario_role fr ON fr.funcionario_id = f.id
    GROUP BY f.id
    ORDER BY p.nome
  `);
  return rows.map(r => ({ ...r, roles: r.roles ? r.roles.split(',') : [] }));
}

async function getFuncionarioById(funcionarioId) {
  const [[row]] = await db.query(`
    SELECT p.*, f.id AS funcionario_id, f.cargo, f.ativo AS funcionario_ativo
    FROM funcionario f JOIN pessoa p ON p.id = f.pessoa_id WHERE f.id = ?
  `, [funcionarioId]);
  if (!row) return null;
  const [roles] = await db.query(
    'SELECT role FROM funcionario_role WHERE funcionario_id = ?', [funcionarioId]
  );
  return { ...row, roles: roles.map(r => r.role) };
}

async function createFuncionario(pessoaId, cargo) {
  const [res] = await db.query(
    'INSERT INTO funcionario (pessoa_id, cargo) VALUES (?, ?)',
    [pessoaId, cargo]
  );
  return res.insertId;
}

async function updateFuncionario(funcionarioId, data) {
  const { cargo, ativo } = data;
  await db.query(
    'UPDATE funcionario SET cargo = ?, ativo = ? WHERE id = ?',
    [cargo, ativo, funcionarioId]
  );
}

async function setRoles(funcionarioId, roles) {
  await db.query('DELETE FROM funcionario_role WHERE funcionario_id = ?', [funcionarioId]);
  for (const role of roles) {
    await db.query(
      'INSERT IGNORE INTO funcionario_role (funcionario_id, role) VALUES (?, ?)',
      [funcionarioId, role]
    );
  }
}

module.exports = { getFuncionarios, getFuncionarioById, createFuncionario, updateFuncionario, setRoles };
