// Gerencia clientes, endereços, formas de pagamento e entregadores
// Todas as rotas verificam autenticação e ownership antes de processar

const bcrypt = require('bcryptjs');
const m = require('../models/clienteModel');
const authM = require('../models/authModel');
const { sendJSON, parseBody } = require('../utils/http');
const { requireRole, requireOwnerOrAdmin, requireAuth } = require('../middlewares/auth');
const { getSession } = require('../config/session');

// ======  Clientes ======
async function listarClientes(req, res) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;
  const clientes = await m.getClientes();
  sendJSON(res, 200, clientes);
}

async function detalharCliente(req, res, clienteId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const cliente = await m.getClienteById(clienteId);
  if (!cliente) return sendJSON(res, 404, { erro: 'Cliente não encontrado.' });
  const [enderecos, pagamentos] = await Promise.all([
    m.getEnderecos(clienteId),
    m.getFormasPagamento(clienteId),
  ]);
  sendJSON(res, 200, { ...cliente, enderecos, pagamentos });
}

async function atualizarCliente(req, res, clienteId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const body = await parseBody(req);
  const cliente = await m.getClienteById(clienteId);
  if (!cliente) return sendJSON(res, 404, { erro: 'Cliente não encontrado.' });
  await m.updateCliente(cliente.id, body);
  sendJSON(res, 200, { ok: true });
}

// ======  Endereços ======
async function listarEnderecos(req, res, clienteId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const enderecos = await m.getEnderecos(clienteId);
  sendJSON(res, 200, enderecos);
}

async function criarEndereco(req, res, clienteId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const body = await parseBody(req);
  const id = await m.createEndereco(clienteId, body);
  sendJSON(res, 201, { ok: true, id });
}

async function atualizarEndereco(req, res, clienteId, enderecoId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateEndereco(enderecoId, clienteId, body);
  sendJSON(res, 200, { ok: true });
}

async function excluirEndereco(req, res, clienteId, enderecoId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  await m.deleteEndereco(enderecoId, clienteId);
  sendJSON(res, 200, { ok: true });
}

// ======  Formas de pagamento ======

async function criarFormaPagamento(req, res, clienteId) {
  const session = requireOwnerOrAdmin(req, res, clienteId);
  if (!session) return;
  const body = await parseBody(req);
  const id = await m.createFormaPagamento(clienteId, body);
  sendJSON(res, 201, { ok: true, id });
}

// ======  Entregadores ======

async function listarEntregadores(req, res) {
  const session = requireRole(req, res, ['admin', 'pedidos']);
  if (!session) return;
  const entregadores = await m.getEntregadores(false);
  sendJSON(res, 200, entregadores);
}

async function criarEntregador(req, res) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;
  const body = await parseBody(req);
  const { cpf, nome, email, telefone, login: loginInput, senha, cnh, placa_veiculo } = body;

  if (!cpf || !nome || !email || !loginInput || !senha || !cnh || !placa_veiculo) {
    return sendJSON(res, 400, { erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const existe = await authM.cpfOuEmailExiste(cpf, email);
  if (existe) return sendJSON(res, 409, { erro: 'CPF ou e-mail já cadastrado.' });

  const loginOcupado = await authM.loginExiste(loginInput.trim());
  if (loginOcupado) return sendJSON(res, 409, { erro: 'Este login já está em uso. Escolha outro.' });

  const senha_hash = await bcrypt.hash(senha, 12);
  const pessoaId = await authM.createPessoa({ cpf, nome, email, telefone, login: loginInput, senha_hash });
  const entregadorId = await m.createEntregador(pessoaId, { cnh, placa_veiculo });
  sendJSON(res, 201, { ok: true, entregadorId });
}

async function atualizarEntregador(req, res, entregadorId) {
  const session = requireRole(req, res, ['admin']);
  if (!session) return;
  const body = await parseBody(req);
  await m.updateEntregador(entregadorId, body);
  sendJSON(res, 200, { ok: true });
}

module.exports = {
  listarClientes, detalharCliente, atualizarCliente,
  listarEnderecos, criarEndereco, atualizarEndereco, excluirEndereco,
  criarFormaPagamento,
  listarEntregadores, criarEntregador, atualizarEntregador,
};
