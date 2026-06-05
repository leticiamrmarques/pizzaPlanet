// Queries de pedidos, itens e histórico de status

const db = require('../config/db');

// ====== Criação do pedido ======
async function criarPedido(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { clienteId, enderecoId, tipoPagamento, observacaoPagamento, valorItens, valorFrete, valorTotal, pizzas, bebidas } = data;

    const [res] = await conn.query(
      `INSERT INTO pedido (cliente_id, endereco_id, tipo_pagamento, observacao_pagamento, valor_itens, valor_frete, valor_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, enderecoId, tipoPagamento, observacaoPagamento || null, valorItens, valorFrete, valorTotal]
    );
    const pedidoId = res.insertId;

    // Status inicial
    await conn.query(
      `INSERT INTO pedido_status_historico (pedido_id, status) VALUES (?, 'aguardando_aprovacao')`,
      [pedidoId]
    );

    // Pizzas
    for (const p of (pizzas || [])) {
      const [rp] = await conn.query(
        `INSERT INTO pedido_item_pizza (pedido_id, tamanho_id, borda_id, quantidade, valor_unitario, valor_borda)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, p.tamanhoId, p.bordaId || null, p.quantidade, p.valorUnitario, p.valorBorda || 0]
      );
      const itemId = rp.insertId;
      for (const saborId of (p.sabores || [])) {
        await conn.query(
          'INSERT INTO pedido_item_pizza_sabor (pedido_item_pizza_id, sabor_id) VALUES (?, ?)',
          [itemId, saborId]
        );
      }
    }

    // Bebidas
    for (const b of (bebidas || [])) {
      await conn.query(
        `INSERT INTO pedido_item_bebida (pedido_id, bebida_disponivel_id, quantidade, valor_unitario)
         VALUES (?, ?, ?, ?)`,
        [pedidoId, b.bebidaDisponivelId, b.quantidade, b.valorUnitario]
      );
    }

    await conn.commit();
    return pedidoId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ====== Leitura ======
async function getPedidos({ status, clienteId, entregadorId, limit = 50 } = {}) {
  let sql = `
    SELECT
      p.id, p.criado_em, p.valor_total, p.tipo_pagamento, p.status_pagamento,
      pe.nome AS cliente_nome,
      (SELECT psh.status FROM pedido_status_historico psh
       WHERE psh.pedido_id = p.id ORDER BY psh.alterado_em DESC LIMIT 1) AS status_atual
    FROM pedido p
    JOIN cliente c ON c.id = p.cliente_id
    JOIN pessoa pe ON pe.id = c.pessoa_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND (SELECT psh2.status FROM pedido_status_historico psh2
             WHERE psh2.pedido_id = p.id ORDER BY psh2.alterado_em DESC LIMIT 1) = ?`;
    params.push(status);
  }
  if (clienteId) { sql += ' AND p.cliente_id = ?'; params.push(clienteId); }
  if (entregadorId) { sql += ' AND p.entregador_id = ?'; params.push(entregadorId); }

  sql += ' ORDER BY p.criado_em DESC LIMIT ?';
  params.push(limit);

  const [rows] = await db.query(sql, params);
  return rows;
}

async function getPedidoById(id) {
  const [[pedido]] = await db.query(`
    SELECT
      p.*,
      pe.nome AS cliente_nome, pe.telefone AS cliente_telefone,
      ce.logradouro, ce.numero, ce.complemento, ce.bairro, ce.cidade, ce.estado, ce.cep, ce.ponto_referencia
    FROM pedido p
    JOIN cliente c ON c.id = p.cliente_id
    JOIN pessoa pe ON pe.id = c.pessoa_id
    JOIN cliente_endereco ce ON ce.id = p.endereco_id
    WHERE p.id = ?
  `, [id]);
  if (!pedido) return null;

  // Pizzas + sabores
  const [pizzas] = await db.query(`
    SELECT pip.*, pt.nome AS tamanho_nome, pb.nome AS borda_nome
    FROM pedido_item_pizza pip
    JOIN pizza_tamanho pt ON pt.id = pip.tamanho_id
    LEFT JOIN pizza_borda pb ON pb.id = pip.borda_id
    WHERE pip.pedido_id = ?
  `, [id]);

  for (const pizza of pizzas) {
    const [sabores] = await db.query(`
      SELECT ps.nome FROM pedido_item_pizza_sabor pips
      JOIN pizza_sabor ps ON ps.id = pips.sabor_id
      WHERE pips.pedido_item_pizza_id = ?
    `, [pizza.id]);
    pizza.sabores = sabores.map(s => s.nome);
  }

  // Bebidas
  const [bebidas] = await db.query(`
    SELECT pib.*, bt.nome AS tipo, bs.nome AS sabor, bv.volume_ml
    FROM pedido_item_bebida pib
    JOIN bebida_disponivel bd ON bd.id = pib.bebida_disponivel_id
    JOIN bebida_sabor bs ON bs.id = bd.sabor_id
    JOIN bebida_volume bv ON bv.id = bd.volume_id
    JOIN bebida_tipo bt ON bt.id = bs.bebida_tipo_id
    WHERE pib.pedido_id = ?
  `, [id]);

  // Histórico
  const [historico] = await db.query(`
    SELECT psh.*, pe.nome AS funcionario_nome
    FROM pedido_status_historico psh
    LEFT JOIN funcionario f ON f.id = psh.funcionario_id
    LEFT JOIN pessoa pe ON pe.id = f.pessoa_id
    WHERE psh.pedido_id = ?
    ORDER BY psh.alterado_em ASC
  `, [id]);

  return { ...pedido, pizzas, bebidas, historico };
}

// ====== Alteração de status ======
async function alterarStatus(pedidoId, novoStatus, funcionarioId = null, observacao = null) {
  await db.query(
    `INSERT INTO pedido_status_historico (pedido_id, funcionario_id, status, observacao)
     VALUES (?, ?, ?, ?)`,
    [pedidoId, funcionarioId, novoStatus, observacao]
  );
}

async function confirmarPagamento(pedidoId, referencia = null) {
  await db.query(
    `UPDATE pedido SET status_pagamento = 'pago', referencia_pagamento = ? WHERE id = ?`,
    [referencia, pedidoId]
  );
}

async function atribuirEntregador(pedidoId, entregadorId) {
  await db.query('UPDATE pedido SET entregador_id = ? WHERE id = ?', [entregadorId, pedidoId]);
}

async function getStatusAtual(pedidoId) {
  const [[row]] = await db.query(
    `SELECT status FROM pedido_status_historico WHERE pedido_id = ? ORDER BY alterado_em DESC LIMIT 1`,
    [pedidoId]
  );
  return row ? row.status : null;
}

module.exports = {
  criarPedido, getPedidos, getPedidoById,
  alterarStatus, confirmarPagamento, atribuirEntregador, getStatusAtual,
};
