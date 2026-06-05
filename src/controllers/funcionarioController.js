// CRUD de funcionários e gestão de roles (apenas admin)

const bcrypt = require('bcryptjs');
const m = require('../models/funcionarioModel');
const authM = require('../models/authModel');
const { sendJSON, parseBody } = require('../utils/http');
const { requireRole } = require('../middlewares/auth');

async function listar(req, res) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;
  const funcionarios = await m.getFuncionarios();
  sendJSON(res, 200, funcionarios);
}

async function detalhar(req, res, id) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;
  const f = await m.getFuncionarioById(id);
  if (!f) return sendJSON(res, 404, { erro: 'Funcionário não encontrado.' });
  sendJSON(res, 200, f);
}

async function criar(req, res) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;

  const body = await parseBody(req);
  const { cpf, nome, email, telefone, login: loginInput, senha, cargo, roles } = body;

  const existe = await authM.cpfOuEmailExiste(cpf, email);
  if (existe) return sendJSON(res, 409, { erro: 'CPF ou e-mail já cadastrado.' });

  const loginOcupado = await authM.loginExiste(loginInput.trim());
  if (loginOcupado) return sendJSON(res, 409, { erro: 'Este login já está em uso. Escolha outro.' });

  const senha_hash = await bcrypt.hash(senha, 12);
  const pessoaId = await authM.createPessoa({ cpf, nome, email, telefone, login: loginInput, senha_hash });
  const funcionarioId = await m.createFuncionario(pessoaId, cargo);

  if (roles?.length) {
    await m.setRoles(funcionarioId, roles);
  }

  sendJSON(res, 201, { ok: true, funcionarioId });
}

async function atualizar(req, res, id) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;

  const body = await parseBody(req);
  const { cargo, ativo, roles } = body;

  await m.updateFuncionario(id, { cargo, ativo });
  if (roles) await m.setRoles(id, roles);

  sendJSON(res, 200, { ok: true });
}

module.exports = { listar, detalhar, criar, atualizar };
