// Utilitários globais: sessão, login modal, logout, toast

// ====== Estado de sessão ======
let _sessao = null;

async function carregarSessao() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      _sessao = await res.json();
    } else {
      _sessao = null;
    }
  } catch {
    _sessao = null;
  }
  aplicarSessaoNoHeader();
  return _sessao;
}

function getSessao() { return _sessao; }

function aplicarSessaoNoHeader() {
  const s = _sessao;

  const navLogin    = document.getElementById('nav-login');
  const navLogout   = document.getElementById('nav-logout');
  const navNome     = document.getElementById('nav-nome');
  const navPainel   = document.getElementById('nav-painel');
  const navEntregas = document.getElementById('nav-entregas');
  const navCarrinho = document.getElementById('nav-carrinho');

  if (!s) {
    if (navLogin)    navLogin.style.display    = '';
    if (navLogout)   navLogout.style.display   = 'none';
    if (navPainel)   navPainel.style.display   = 'none';
    if (navEntregas) navEntregas.style.display = 'none';
    if (navCarrinho) navCarrinho.style.display = '';
    return;
  }

  if (navLogin)  navLogin.style.display  = 'none';
  if (navLogout) navLogout.style.display = '';
  if (navNome)   navNome.textContent     = `Olá, ${s.nome.split(' ')[0]} · Sair`;

  if (s.perfil === 'funcionario') {
    if (navPainel)   navPainel.style.display   = '';
    if (navCarrinho) navCarrinho.style.display = 'none';
  } else if (s.perfil === 'entregador') {
    if (navEntregas) navEntregas.style.display = '';
    if (navCarrinho) navCarrinho.style.display = 'none';
  } else if (s.perfil === 'cliente') {
    if (navCarrinho) navCarrinho.style.display = '';
    const navConta = document.getElementById('nav-minha-conta');
    if (navConta) navConta.style.display = '';
  }
}

// ====== Login ======
function mostrarLogin() {
  document.getElementById('modal-login')?.classList.remove('hidden');
}

function fecharModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

async function submitLogin() {
  const loginInput = document.getElementById('login-input').value.trim();
  const senha      = document.getElementById('login-senha').value;
  const erroEl     = document.getElementById('login-erro');
  erroEl.style.display = 'none';

  if (!loginInput || !senha) {
    erroEl.textContent = 'Preencha login e senha.';
    erroEl.style.display = 'block';
    return;
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginInput, senha }),
  });
  const json = await res.json();

  if (!res.ok) {
    erroEl.textContent = json.erro || 'Erro ao fazer login.';
    erroEl.style.display = 'block';
    return;
  }

  fecharModal('modal-login');
  toast('Login realizado!', 'sucesso');
  await carregarSessao();

  // Redirecionar conforme perfil
  setTimeout(() => { window.location.href = json.destino || '/cardapio'; }, 600);
}

async function fazerLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  _sessao = null;
  window.location.href = '/cardapio';
}

// ====== Toast ======
function toast(mensagem, tipo = 'info', duracao = 3200) {
  const container = document.getElementById('toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.textContent = mensagem;
  container.appendChild(el);
  setTimeout(() => el.remove(), duracao);
}

// ====== Helpers de formatação ======
function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dt) {
  return new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function badgeStatus(status) {
  const map = {
    aguardando_aprovacao: ['badge-aguardando', 'Aguard. Aprovação'],
    em_producao: ['badge-producao', 'Em Produção'],
    saiu_para_entrega: ['badge-saiu', 'Saiu p/ Entrega'],
    entregue: ['badge-entregue', 'Entregue'],
    cancelado: ['badge-cancelado', 'Cancelado'],
  };
  const [cls, label] = map[status] || ['badge-aguardando', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ======Promise global da sessão ======
let _sessaoPromise = null;

function getSessaoPromise() { return _sessaoPromise; }

// ====== Inicialização ======
document.addEventListener('DOMContentLoaded', () => {
  _sessaoPromise = carregarSessao();

  // Fechar modais ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.add('hidden');
    });
  });

  // Enter no campo de login
  document.getElementById('login-senha')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitLogin();
  });
});
