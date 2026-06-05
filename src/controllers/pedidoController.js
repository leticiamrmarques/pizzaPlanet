// Criação, listagem e mudança de status de pedidos

const m = require('../models/pedidoModel');
const { getEntregadores } = require('../models/clienteModel');
const { sendJSON, parseBody, parsePath } = require('../utils/http');
const { requireCliente, requireRole } = require('../middlewares/auth');
const { getSession } = require('../config/session');

// Transições de status permitidas por perfil
const TRANSICOES = {
  aguardando_aprovacao: ['em_producao', 'cancelado'],
  em_producao: ['saiu_para_entrega', 'cancelado'],
  saiu_para_entrega: ['entregue'],
  entregue: [],
  cancelado: [],
};

async function criarPedido(req, res) {
  const session = requireCliente(req, res);
  if (!session) return;

  const body = await parseBody(req);
  const { enderecoId, tipoPagamento, observacaoPagamento, pizzas, bebidas } = body;

  if (!enderecoId || !tipoPagamento || (!pizzas?.length && !bebidas?.length)) {
    return sendJSON(res, 400, { erro: 'Dados incompletos para criar o pedido.' });
  }

  // Calcular totais
  let valorItens = 0;
  for (const p of (pizzas || [])) {
    valorItens += (Number(p.valorUnitario) + Number(p.valorBorda || 0)) * p.quantidade;
  }
  for (const b of (bebidas || [])) {
    valorItens += Number(b.valorUnitario) * b.quantidade;
  }
  const valorFrete = 10.00;
  const valorTotal = valorItens + valorFrete;

  const pedidoId = await m.criarPedido({
    clienteId: session.clienteId,
    enderecoId,
    tipoPagamento,
    observacaoPagamento: observacaoPagamento || null,
    valorItens: valorItens.toFixed(2),
    valorFrete,
    valorTotal: valorTotal.toFixed(2),
    pizzas,
    bebidas,
  });

  sendJSON(res, 201, { ok: true, pedidoId });
}

async function listarPedidos(req, res) {
  const session = getSession(req);
  if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });

  const { query } = parsePath(req);
  const status = query.get('status') || null;

  let filtro = {};
  if (session.perfil === 'cliente') {
    filtro.clienteId = session.clienteId;
  } else if (session.perfil === 'entregador') {
    filtro.entregadorId = session.entregadorId;
    filtro.status = 'saiu_para_entrega';
  } else {
    if (status) filtro.status = status;
  }

  const pedidos = await m.getPedidos(filtro);
  sendJSON(res, 200, pedidos);
}

async function detalharPedido(req, res, id) {
  const session = getSession(req);
  if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });

  const pedido = await m.getPedidoById(id);
  if (!pedido) return sendJSON(res, 404, { erro: 'Pedido não encontrado.' });

  // Clientes só veem seus próprios pedidos
  if (session.perfil === 'cliente' && pedido.cliente_id !== session.clienteId) {
    return sendJSON(res, 403, { erro: 'Sem permissão.' });
  }

  sendJSON(res, 200, pedido);
}

async function atualizarStatus(req, res, id) {
  // Tanto funcionário (roles pedidos/admin) quanto entregador podem alterar status
  const session = getSession(req);
  if (!session) return sendJSON(res, 401, { erro: 'Não autenticado.' });

  const ehFuncionario = session.perfil === 'funcionario' &&
    (session.roles?.includes('pedidos') || session.roles?.includes('admin'));
  const ehEntregador = session.perfil === 'entregador';

  if (!ehFuncionario && !ehEntregador) {
    return sendJSON(res, 403, { erro: 'Sem permissão.' });
  }

  const body = await parseBody(req);
  const { novoStatus, observacao, entregadorId, confirmarPagamento: confPag } = body;

  const statusAtual = await m.getStatusAtual(id);
  if (!statusAtual) return sendJSON(res, 404, { erro: 'Pedido não encontrado.' });

  if (statusAtual === 'cancelado') {
    return sendJSON(res, 400, { erro: 'Pedido cancelado não pode ser alterado.' });
  }

  // Entregador só pode marcar entregue (de saiu_para_entrega) ou confirmar pagamento
  if (ehEntregador) {
    if (novoStatus === 'entregue' && statusAtual !== 'saiu_para_entrega') {
      return sendJSON(res, 400, { erro: 'Só pode confirmar entrega de pedidos em rota.' });
    }
    if (novoStatus !== 'entregue' && !confPag) {
      return sendJSON(res, 403, { erro: 'Entregador só pode confirmar entrega ou pagamento.' });
    }
  }

  const permitidos = TRANSICOES[statusAtual] || [];
  if (!permitidos.includes(novoStatus) && !confPag) {
    return sendJSON(res, 400, { erro: `Transição inválida: ${statusAtual} → ${novoStatus}` });
  }

  // Confirmar pagamento apenas quando explicitamente solicitado (pelo entregador)
  if (confPag) {
    await m.confirmarPagamento(id, body.referenciaPagamento || null);
    if (!novoStatus) return sendJSON(res, 200, { ok: true });
  }

  // Atribuir entregador ao despachar (apenas funcionário, não entregador)
  if (novoStatus === 'saiu_para_entrega' && !ehEntregador) {
    if (!entregadorId) return sendJSON(res, 400, { erro: 'Informe o entregador.' });
    await m.atribuirEntregador(id, entregadorId);
  }

  await m.alterarStatus(id, novoStatus, session.funcionarioId || null, observacao || null);
  sendJSON(res, 200, { ok: true });
}

async function getEntregadoresDisponiveis(req, res) {
  const session = requireRole(req, res, ['pedidos', 'admin']);
  if (!session) return;
  const entregadores = await getEntregadores(true);
  sendJSON(res, 200, entregadores);
}

module.exports = { criarPedido, listarPedidos, detalharPedido, atualizarStatus, getEntregadoresDisponiveis };
