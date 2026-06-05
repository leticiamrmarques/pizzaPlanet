// Define os endereços HTTP relacionados à autenticação e perfil do usuário
// Recebe as requisições, aciona o controller correto e retorna a resposta
// Rotas: POST /login, POST /logout, POST /cadastro, GET|PUT /perfil, PUT /senha

const ctrl = require('../controllers/authController');
const { methodNotAllowed, sendJSON, parseBody } = require('../utils/http');
const { getSession } = require('../config/session');

async function authRouter(req, res, pathname) {
  try {
    if (pathname === '/api/auth/login') {
      if (req.method === 'POST') return await ctrl.login(req, res);
      return methodNotAllowed(res);
    }

    if (pathname === '/api/auth/logout') {
      if (req.method === 'POST') return await ctrl.logout(req, res);
      return methodNotAllowed(res);
    }

    if (pathname === '/api/auth/cadastro') {
      if (req.method === 'POST') return await ctrl.cadastrarCliente(req, res);
      return methodNotAllowed(res);
    }

    if (pathname === '/api/auth/me') {
      if (req.method === 'GET') {
        const session = getSession(req);
        if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });
        return sendJSON(res, 200, {
          nome: session.nome,
          perfil: session.perfil,
          roles: session.roles || [],
          clienteId: session.clienteId,
          funcionarioId: session.funcionarioId,
          entregadorId: session.entregadorId,
        });
      }
      return methodNotAllowed(res);
    }

    if (pathname === '/api/auth/perfil') {
      const session = getSession(req);
      if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });

      if (req.method === 'GET') {
        const { getPessoaById } = require('../models/authModel');
        const pessoa = await getPessoaById(session.pessoaId);
        if (!pessoa) return sendJSON(res, 404, { erro: 'Pessoa não encontrada.' });
        return sendJSON(res, 200, {
          nome: pessoa.nome,
          cpf: pessoa.cpf,
          email: pessoa.email,
          telefone: pessoa.telefone,
          login: pessoa.login,
        });
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const { updatePessoaDados } = require('../models/authModel');
        await updatePessoaDados(session.pessoaId, body);
        return sendJSON(res, 200, { ok: true });
      }
      return methodNotAllowed(res);
    }

    if (pathname === '/api/auth/senha') {
      if (req.method === 'PUT') {
        const session = getSession(req);
        if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });
        const body = await parseBody(req);
        const { senhaAtual, novaSenha } = body;
        if (!senhaAtual || !novaSenha) return sendJSON(res, 400, { erro: 'Preencha todos os campos.' });
        if (novaSenha.length < 6) return sendJSON(res, 400, { erro: 'A senha deve ter no mínimo 6 caracteres.' });
        const { getPessoaById, updateSenha } = require('../models/authModel');
        const bcrypt = require('bcryptjs');
        const pessoa = await getPessoaById(session.pessoaId);
        const senhaOk = await bcrypt.compare(senhaAtual, pessoa.senha_hash);
        if (!senhaOk) return sendJSON(res, 401, { erro: 'Senha atual incorreta.' });
        const novoHash = await bcrypt.hash(novaSenha, 10);
        await updateSenha(session.pessoaId, novoHash);
        return sendJSON(res, 200, { ok: true });
      }
      return methodNotAllowed(res);
    }

    return false;
  } catch (err) {
    console.error('[authRouter]', err);
    sendJSON(res, 500, { erro: 'Erro interno.' });
  }
}

module.exports = authRouter;
