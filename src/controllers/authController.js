// Login, logout e cadastro de cliente

const bcrypt = require('bcryptjs');
const { findPessoaByLogin, findPerfil, createPessoa, createCliente, cpfOuEmailExiste, loginExiste } = require('../models/authModel');
const { createSession, destroySession, setCookieHeader, clearCookieHeader } = require('../config/session');
const { sendJSON, redirect, parseBody } = require('../utils/http');

async function login(req, res) {
  const body = await parseBody(req);
  const { login: loginInput, senha } = body;

  if (!loginInput || !senha) {
    return sendJSON(res, 400, { erro: 'Login e senha são obrigatórios.' });
  }

  const pessoa = await findPessoaByLogin(loginInput.trim());
  if (!pessoa) {
    return sendJSON(res, 401, { erro: 'Usuário não encontrado.' });
  }

  const senhaOk = await bcrypt.compare(senha, pessoa.senha_hash);
  if (!senhaOk) {
    return sendJSON(res, 401, { erro: 'Senha incorreta.' });
  }

  const perfil = await findPerfil(pessoa.id);
  if (!perfil) {
    return sendJSON(res, 403, { erro: 'Conta sem perfil ativo.' });
  }

  const sid = createSession({
    pessoaId: pessoa.id,
    nome: pessoa.nome,
    ...perfil,
  });

  // Definir destino por perfil
  let destino = '/';
  if (perfil.perfil === 'funcionario') destino = '/painel/pedidos';
  else if (perfil.perfil === 'entregador') destino = '/painel/entregas';
  else if (perfil.perfil === 'cliente') destino = '/cardapio';

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': setCookieHeader(sid),
  });
  res.end(JSON.stringify({ ok: true, perfil: perfil.perfil, destino }));
}

async function logout(req, res) {
  destroySession(req);
  res.writeHead(302, {
    Location: '/',
    'Set-Cookie': clearCookieHeader(),
  });
  res.end();
}

async function cadastrarCliente(req, res) {
  const body = await parseBody(req);
  const { cpf, nome, email, telefone, login: loginInput, senha } = body;

  if (!cpf || !nome || !email || !loginInput || !senha) {
    return sendJSON(res, 400, { erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const existe = await cpfOuEmailExiste(cpf, email);
  if (existe) {
    return sendJSON(res, 409, { erro: 'CPF ou e-mail já cadastrado.' });
  }

  const loginOcupado = await loginExiste(loginInput.trim());
  if (loginOcupado) {
    return sendJSON(res, 409, { erro: 'Este login já está em uso. Escolha outro.' });
  }

  const senha_hash = await bcrypt.hash(senha, 12);
  const pessoaId = await createPessoa({ cpf, nome, email, telefone, login: loginInput, senha_hash });
  const clienteId = await createCliente(pessoaId);

  const sid = createSession({ pessoaId, nome, perfil: 'cliente', clienteId });

  res.writeHead(201, {
    'Content-Type': 'application/json',
    'Set-Cookie': setCookieHeader(sid),
  });
  res.end(JSON.stringify({ ok: true, destino: '/cardapio' }));
}

module.exports = { login, logout, cadastrarCliente };
