// Cardápio, slides, carrinho e finalização de pedido

// ====== Mapa de imagens por nome de sabor ======
const IMAGENS_SABOR = {
  'calabresa': '/img/Sabores/calabresa.png',
  'mussarela': '/img/Sabores/marquerita.png',
  'portuguesa': '/img/Sabores/portuguesa.png',
  'frango com catupiry': '/img/Sabores/frango.png',
  'quatro queijos': '/img/Sabores/4queijos.png',
  'marguerita': '/img/Sabores/marquerita.png',
  'lombo': '/img/Sabores/LOMBO.png',
  'affumacita': '/img/Sabores/affumicata.png',
  'chocolate': '/img/Sabores/chocolate.png',
  'banana com canela': '/img/Sabores/banana.png',
  'romeu e julieta': '/img/Sabores/romeu.png',
  'chocolate com morango': '/img/Sabores/morango.png',
};

function imgSabor(nome) {
  return IMAGENS_SABOR[nome.toLowerCase()] || '/img/Sabores/marquerita.png';
}

// ====== Estado ====== 
let cardapio = null;
let carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_pp') || '{"pizzas":[],"bebidas":[]}');

function salvarCarrinho() {
  localStorage.setItem('carrinho_pp', JSON.stringify(carrinhoLocal));
  atualizarBadge();
  atualizarResumo();
  verificarAreaFinalizar(); // atualiza área de finalização sempre que o carrinho muda (função async)
}

function atualizarBadge() {
  const total = carrinhoLocal.pizzas.length + carrinhoLocal.bebidas.length;
  const el = document.getElementById('badge-qtd');
  if (el) el.textContent = total;
}

// ======  Carregar cardápio ======
async function carregarCardapio() {
  try {
    const res = await fetch('/api/cardapio');
    if (!res.ok) throw new Error('Erro na API');
    cardapio = await res.json();
  } catch (e) {
    console.error('Erro ao carregar cardápio:', e);
    return;
  }

  renderizarSlidesDestaques();
  renderizarSliderAvaliacoes();
  preencherSelectTamanhos();
  preencherSelectBordas();
  preencherSelectBebidas();
}

// ======  Slides de Destaque ====== 
function renderizarSlidesDestaques() {
  const container = document.getElementById('slide-destaque');
  if (!container) return;

  container.querySelectorAll('.pizzas-destaque').forEach(el => el.remove());

  const sabores = cardapio.sabores;
  const POR_SLIDE = 3;

  for (let i = 0; i < sabores.length; i += POR_SLIDE) {
    const grupo = sabores.slice(i, i + POR_SLIDE);
    const slide = document.createElement('div');
    slide.className = 'pizzas-destaque' + (i === 0 ? ' destaque-ativo' : '');

    grupo.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card-sabores hover-effect-card';
      card.innerHTML = `
        <img src="${imgSabor(s.nome)}" alt="Pizza ${s.nome}">
        <h3>${s.nome.toUpperCase()}</h3>
        <p>${s.descricao || ''}</p>
        <a href="#" class="hover-effect-card" onclick="selecionarSaborEAbrirCarrinho(${s.id},'${s.nome.replace(/'/g,"\\'")}');return false">FAÇA SEU PEDIDO</a>
      `;
      slide.appendChild(card);
    });

    const btnSetas = container.querySelector('.btn-setas');
    container.insertBefore(slide, btnSetas);
  }

  configurarSetas('setaEsquerda-destaques', 'setaDireita-destaques', '.pizzas-destaque', 'destaque-ativo');
}

function selecionarSaborEAbrirCarrinho(saborId, saborNome) {
  abrirCarrinho();
  setTimeout(() => {
    const container = document.getElementById('sabores-container');
    if (!container) return;
    const cb = container.querySelector(`input[value="${saborId}"]`);
    if (cb) {
      container.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = false; c.disabled = false; });
      cb.checked = true;
      atualizarMaxSabores();
    }
  }, 100);
}

// ======  Slide de Avaliações ====== 
function renderizarSliderAvaliacoes() {
  configurarSetas('setaEsquerda-avaliacao', 'setaDireita-avaliacao', '.avaliacoes-destaque', 'avaliacoes-ativo');
}

// ======  Helper de setas para qualquer slide ======
function configurarSetas(idEsq, idDir, seletor, classeAtivo) {
  const btnEsq = document.getElementById(idEsq);
  const btnDir = document.getElementById(idDir);
  if (!btnEsq || !btnDir) return;

  function slides() { return [...document.querySelectorAll(seletor)]; }
  function idx() { return slides().findIndex(s => s.classList.contains(classeAtivo)); }

  function ir(delta) {
    const lista = slides();
    if (!lista.length) return;
    const atual = idx();
    lista[atual].classList.remove(classeAtivo);
    const proximo = (atual + delta + lista.length) % lista.length;
    lista[proximo].classList.add(classeAtivo);
  }

  btnEsq.onclick = () => ir(-1);
  btnDir.onclick = () => ir(1);
}

// ======  Preencher selects do overlay ======
function preencherSelectTamanhos() {
  const sel = document.getElementById('tamanho-pizza');
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>Selecione o tamanho</option>';
  cardapio.tamanhos.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.dataset.preco = t.preco;
    opt.dataset.max = t.max_sabores;
    opt.textContent = `${t.nome.toUpperCase()} – R$ ${Number(t.preco).toFixed(2).replace('.',',')} – ${t.max_sabores} sabor${t.max_sabores > 1 ? 'es' : ''}`;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', atualizarMaxSabores);
}

function preencherSelectBordas() {
  const sel = document.getElementById('borda-pizza');
  if (!sel) return;
  sel.innerHTML = '<option value="">Sem borda</option>';
  cardapio.bordas.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.dataset.preco = b.preco;
    opt.textContent = `${b.nome} (+R$ ${Number(b.preco).toFixed(2).replace('.',',')})`;
    sel.appendChild(opt);
  });
}

function preencherSelectBebidas() {
  const selTipo = document.getElementById('tipo-bebida');
  if (!selTipo) return;

  const tipos = {};
  cardapio.bebidas.forEach(b => {
    if (!tipos[b.tipo]) tipos[b.tipo] = [];
    tipos[b.tipo].push(b);
  });

  selTipo.innerHTML = '<option value="">Sem bebida</option>';
  Object.keys(tipos).forEach(tipo => {
    const opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    selTipo.appendChild(opt);
  });

  selTipo.addEventListener('change', () => {
    const tipo = selTipo.value;
    const wrapVol = document.getElementById('container-tamanho-bebida');
    const wrapSab = document.getElementById('container-sabor-bebida');
    const wrapBtn = document.getElementById('btn-bebida-wrap');
    const selVol  = document.getElementById('volume-bebida');
    const selSab  = document.getElementById('sabor-bebida');

    if (!tipo) {
      wrapVol.style.display = 'none';
      wrapSab.style.display = 'none';
      wrapBtn.style.display = 'none';
      selVol.disabled = true;
      selSab.disabled = true;
      return;
    }

    const itens = tipos[tipo] || [];

    const volumes = [...new Map(itens.map(b => [b.volume_id, b])).values()];
    selVol.innerHTML = '';
    volumes.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.volume_id;
      opt.dataset.preco = b.preco;
      opt.textContent = `${b.volume_ml}ml – R$ ${Number(b.preco).toFixed(2).replace('.',',')}`;
      selVol.appendChild(opt);
    });
    selVol.disabled = false;
    wrapVol.style.display = 'block';

    const sabores = [...new Map(itens.map(b => [b.sabor_id, b])).values()];
    selSab.innerHTML = '';
    sabores.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.sabor_id;
      opt.textContent = b.sabor;
      selSab.appendChild(opt);
    });
    selSab.disabled = false;
    wrapSab.style.display = 'block';
    wrapBtn.style.display = 'block';
  });
}

function preencherSaboresContainer() {
  const container = document.getElementById('sabores-container');
  if (!container || !cardapio) return;
  container.innerHTML = '';
  cardapio.sabores.forEach(s => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${s.id}" data-nome="${s.nome}"> ${s.nome}`;
    label.querySelector('input').addEventListener('change', atualizarMaxSabores);
    container.appendChild(label);
  });
}

function atualizarMaxSabores() {
  const sel = document.getElementById('tamanho-pizza');
  if (!sel || !sel.value) return;
  const opt = sel.options[sel.selectedIndex];
  const max = parseInt(opt.dataset.max || 1);
  document.getElementById('max-sabores').textContent = max;

  const checks = document.querySelectorAll('#sabores-container input[type="checkbox"]');
  const marcados = [...checks].filter(c => c.checked).length;
  checks.forEach(c => {
    if (!c.checked) c.disabled = marcados >= max;
  });
}

// ======  Adicionar pizza ao carrinho ======
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-adicionar-pizza')?.addEventListener('click', adicionarPizza);
  document.getElementById('btn-adicionar-bebida')?.addEventListener('click', adicionarBebida);
  document.getElementById('form-carrinho')?.addEventListener('submit', finalizarPedido);
});

function adicionarPizza() {
  const selTam = document.getElementById('tamanho-pizza');
  if (!selTam.value) { toast('Selecione o tamanho da pizza.', 'erro'); return; }

  const opt = selTam.options[selTam.selectedIndex];
  const tamanhoId     = parseInt(selTam.value);
  const tamanhoNome   = opt.textContent.split(' –')[0];
  const valorUnitario = parseFloat(opt.dataset.preco);
  const maxSabores    = parseInt(opt.dataset.max);

  const saboresSelecionados = [...document.querySelectorAll('#sabores-container input:checked')];
  if (saboresSelecionados.length === 0) { toast('Selecione ao menos um sabor.', 'erro'); return; }
  if (saboresSelecionados.length > maxSabores) { toast(`Máximo de ${maxSabores} sabores para este tamanho.`, 'erro'); return; }

  const sabores      = saboresSelecionados.map(c => parseInt(c.value));
  const saboresNomes = saboresSelecionados.map(c => c.dataset.nome);

  const selBorda  = document.getElementById('borda-pizza');
  const bordaOpt  = selBorda.options[selBorda.selectedIndex];
  const bordaId   = selBorda.value ? parseInt(selBorda.value) : null;
  const bordaNome = selBorda.value ? bordaOpt.textContent.split(' (')[0] : 'Sem borda';
  const valorBorda = parseFloat(bordaOpt.dataset.preco || 0);

  const qtd = parseInt(document.getElementById('quantidade-pizza').value) || 1;

  carrinhoLocal.pizzas.push({ tamanhoId, tamanhoNome, valorUnitario, bordaId, bordaNome, valorBorda, sabores, saboresNomes, quantidade: qtd });
  salvarCarrinho();
  toast('Pizza adicionada ao carrinho!', 'sucesso');

  document.getElementById('tamanho-pizza').value = '';
  document.getElementById('borda-pizza').value = '';
  document.getElementById('quantidade-pizza').value = '1';
  document.getElementById('max-sabores').textContent = '0';
  document.querySelectorAll('#sabores-container input').forEach(c => { c.checked = false; c.disabled = false; });
}

function adicionarBebida() {
  const tipo   = document.getElementById('tipo-bebida').value;
  const selVol = document.getElementById('volume-bebida');
  const selSab = document.getElementById('sabor-bebida');
  if (!tipo || !selVol.value || !selSab.value) { toast('Selecione tipo, volume e sabor da bebida.', 'erro'); return; }

  const volumeId = parseInt(selVol.value);
  const saborId  = parseInt(selSab.value);
  const preco    = parseFloat(selVol.options[selVol.selectedIndex].dataset.preco);
  const nomeBeb  = `${selSab.options[selSab.selectedIndex].textContent} — ${selVol.options[selVol.selectedIndex].textContent.split(' –')[0]}`;

  const disp = cardapio.bebidas.find(b => b.volume_id === volumeId && b.sabor_id === saborId);
  if (!disp) { toast('Combinação indisponível.', 'erro'); return; }

  carrinhoLocal.bebidas.push({ bebidaDisponivelId: disp.disponivel_id, nome: nomeBeb, valorUnitario: preco, quantidade: 1 });
  salvarCarrinho();
  toast(`${nomeBeb} adicionada ao carrinho!`, 'sucesso');
  document.getElementById('tipo-bebida').value = '';
  document.getElementById('container-tamanho-bebida').style.display = 'none';
  document.getElementById('container-sabor-bebida').style.display   = 'none';
  document.getElementById('btn-bebida-wrap').style.display           = 'none';
}

// ======  Abrir / Fechar carrinho ======
async function abrirCarrinho() {
  const overlay = document.getElementById('overlay-carrinho');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  preencherSaboresContainer();
  atualizarResumo();
  await verificarAreaFinalizar();
}

function fecharCarrinho() {
  const overlay = document.getElementById('overlay-carrinho');
  if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
}

// ======  Resumo do carrinho no overlay ======
function atualizarResumo() {
  const div      = document.getElementById('resumo-carrinho');
  const itensDiv = document.getElementById('itens-resumo');
  const totalEl  = document.getElementById('preco-total-valor');
  if (!div) return;

  const temItens = carrinhoLocal.pizzas.length > 0 || carrinhoLocal.bebidas.length > 0;
  div.style.display = temItens ? 'block' : 'none';
  if (!temItens) return;

  let html  = '';
  let total = 0;

  carrinhoLocal.pizzas.forEach((p, i) => {
    const sub = (Number(p.valorUnitario) + Number(p.valorBorda)) * p.quantidade;
    total += sub;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid #f0ede8">
      <div>
        <strong style="font-size:.88rem">${p.saboresNomes.join(' + ')} — ${p.tamanhoNome}</strong><br>
        <small style="color:#888">Borda: ${p.bordaNome} · Qtd: ${p.quantidade}</small>
      </div>
      <div style="text-align:right">
        <strong style="color:#d62828">R$ ${sub.toFixed(2).replace('.',',')}</strong><br>
        <button type="button" onclick="removerPizza(${i})" style="font-size:.75rem;color:#999;background:none;border:none;cursor:pointer">remover</button>
      </div>
    </div>`;
  });

  carrinhoLocal.bebidas.forEach((b, i) => {
    const sub = Number(b.valorUnitario) * b.quantidade;
    total += sub;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid #f0ede8">
      <div>
        <strong style="font-size:.88rem">🥤 ${b.nome}</strong><br>
        <small style="color:#888">Qtd: ${b.quantidade}</small>
      </div>
      <div style="text-align:right">
        <strong style="color:#d62828">R$ ${sub.toFixed(2).replace('.',',')}</strong><br>
        <button type="button" onclick="removerBebida(${i})" style="font-size:.75rem;color:#999;background:none;border:none;cursor:pointer">remover</button>
      </div>
    </div>`;
  });

  if (itensDiv) itensDiv.innerHTML = html;

  // Mostrar subtotal, frete e total separados
  const FRETE = 10;
  const precoTotalDiv = document.getElementById('resumo-carrinho')?.querySelector('.preco-total');
  if (precoTotalDiv) {
    precoTotalDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem;margin-top:.5rem">
        <span>Subtotal</span><span>R$ ${total.toFixed(2).replace('.',',')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem;color:#888">
        <span>Frete</span><span>R$ ${FRETE.toFixed(2).replace('.',',')}</span>
      </div>
      <div style="text-align:center;padding:.8rem 0;font-size:1.4rem;font-weight:700;color:#d62828;border-top:2px solid #f0ede8;margin-top:.5rem">
        Total: R$ ${(total + FRETE).toFixed(2).replace('.',',')}
      </div>`;
  }
}

function removerPizza(i)  { carrinhoLocal.pizzas.splice(i, 1);  salvarCarrinho(); }
function removerBebida(i) { carrinhoLocal.bebidas.splice(i, 1); salvarCarrinho(); }

// ======  Área de finalização ====== 
async function verificarAreaFinalizar(sessaoParam) {
  const areaEntrega = document.getElementById('area-entrega');
  const areaLogin   = document.getElementById('area-login-carrinho');
  const temItens    = carrinhoLocal.pizzas.length > 0 || carrinhoLocal.bebidas.length > 0;

  if (!temItens) {
    if (areaEntrega) areaEntrega.style.display = 'none';
    if (areaLogin)   areaLogin.style.display   = 'none';
    return;
  }

  // Sempre aguardar a promise global da sessão para garantir que está resolvida
  let s;
  if (sessaoParam !== undefined) {
    s = sessaoParam;
  } else {
    try {
      // getSessaoPromise() retorna a mesma promise do DOMContentLoaded (não dispara novo fetch)
      s = await (typeof getSessaoPromise === 'function' ? getSessaoPromise() : carregarSessao());
    } catch {
      s = null;
    }
  }

  if (s?.perfil === 'cliente') {
    if (areaLogin)   areaLogin.style.display   = 'none';
    if (areaEntrega) areaEntrega.style.display = 'block';
    await carregarEnderecos(s.clienteId);
  } else {
    if (areaEntrega) areaEntrega.style.display = 'none';
    if (areaLogin)   areaLogin.style.display   = 'block';
  }
}

async function carregarEnderecos(clienteId) {
  const sel = document.getElementById('select-endereco');
  const endBtnWrap = document.getElementById('area-novo-endereco');
  if (!sel) return;
  // Sempre recarregar para pegar novos endereços
  const res = await fetch(`/api/clientes/${clienteId}/enderecos`);
  const enderecos = await res.json();
  if (enderecos.length) {
    sel.innerHTML = enderecos.map(e => `<option value="${e.id}">${e.logradouro}, ${e.numero} — ${e.bairro}, ${e.cidade}${e.principal ? ' ⭐' : ''}</option>`).join('');
    sel.dataset.loaded = clienteId.toString();
    if (endBtnWrap) endBtnWrap.style.display = 'none';
  } else {
    sel.innerHTML = '<option value="">Nenhum endereço cadastrado</option>';
    if (endBtnWrap) endBtnWrap.style.display = 'block';
  }
}

// ======  Finalizar pedido ─======
function atualizarCampoPagamento() {
  const tipo = document.getElementById('select-pagamento')?.value;
  const areaTroco = document.getElementById('area-troco');
  if (areaTroco) areaTroco.style.display = tipo === 'dinheiro' ? 'block' : 'none';
  if (tipo !== 'dinheiro') {
    const radios = document.querySelectorAll('input[name="troco"]');
    if (radios[0]) radios[0].checked = true;
    const areaValor = document.getElementById('area-valor-troco');
    if (areaValor) areaValor.style.display = 'none';
  }
}

function atualizarTroco() {
  const selecionado = document.querySelector('input[name="troco"]:checked')?.value;
  const areaValor = document.getElementById('area-valor-troco');
  if (areaValor) areaValor.style.display = selecionado === 'valor' ? 'block' : 'none';
}

async function finalizarPedido(e) {
  e.preventDefault();
  const enderecoId    = document.getElementById('select-endereco')?.value;
  const tipoPagamento = document.getElementById('select-pagamento')?.value;

  if (!enderecoId) { toast('Selecione um endereço de entrega.', 'erro'); return; }
  if (!carrinhoLocal.pizzas.length && !carrinhoLocal.bebidas.length) { toast('Seu carrinho está vazio.', 'erro'); return; }

  // Montar observação de pagamento para dinheiro
  let observacaoPagamento = null;
  if (tipoPagamento === 'dinheiro') {
    const trocoOpt = document.querySelector('input[name="troco"]:checked')?.value;
    if (trocoOpt === 'trocado') {
      observacaoPagamento = 'Cliente tem o dinheiro trocado.';
    } else if (trocoOpt === 'valor') {
      const valorTroco = document.getElementById('valor-troco')?.value;
      if (!valorTroco || parseFloat(valorTroco) <= 0) {
        toast('Informe o valor para o troco.', 'erro'); return;
      }
      observacaoPagamento = `Troco para R$ ${parseFloat(valorTroco).toFixed(2).replace('.',',')}`;
    }
  }

  const body = { enderecoId: parseInt(enderecoId), tipoPagamento, observacaoPagamento, pizzas: carrinhoLocal.pizzas, bebidas: carrinhoLocal.bebidas };

  const res = await fetch('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) { toast(json.erro || 'Erro ao finalizar pedido.', 'erro'); return; }

  carrinhoLocal = { pizzas: [], bebidas: [] };
  salvarCarrinho();
  fecharCarrinho();
  toast('Pedido realizado com sucesso! 🎉', 'sucesso');
  setTimeout(() => window.location.href = '/minha-conta?aba=pedidos', 1200);
}

// ======  Init ======
document.addEventListener('DOMContentLoaded', () => {
  carregarCardapio();
  atualizarBadge();

  document.getElementById('overlay-carrinho')?.addEventListener('click', e => {
    if (e.target.id === 'overlay-carrinho') fecharCarrinho();
  });
});