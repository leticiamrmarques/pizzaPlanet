// Inicializa o servidor e gerencia as rotas da aplicação.

require('./utils/env');

const http = require('http');
const path = require('path');
const fs = require('fs');

const { parsePath, notFound, sendJSON } = require('./utils/http');

// Rotas
const authRouter = require('./routes/auth');
const cardapioRouter = require('./routes/cardapio');
const pedidosRouter = require('./routes/pedidos');
const clientesRouter = require('./routes/clientes');
const funcionariosRouter = require('./routes/funcionarios');

const VIEWS_DIR = path.join(__dirname, 'views', 'pages');
const STATIC_DIR = path.join(__dirname, 'views');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

const PAGE_ROUTES = {
  '/': 'home.html',
  '/home': 'home.html',
  '/cardapio': 'cardapio.html',
  '/cadastro': 'cadastro.html',
  '/historico': 'historico.html',
  '/painel/pedidos': 'painel-pedidos.html',
  '/painel/cardapio': 'painel-cardapio.html',
  '/painel/clientes': 'painel-clientes.html',
  '/painel/funcionarios': 'painel-funcionarios.html',
  '/painel/entregas': 'painel-entregas.html',
  '/meu-perfil': 'meu-perfil.html'
};

function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { notFound(res); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = parsePath(req);

  // Arquivos estáticos
  if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/img/')) {
    const decoded = decodeURIComponent(pathname);
    const filePath = path.join(STATIC_DIR, decoded);
    if (!filePath.startsWith(STATIC_DIR)) { notFound(res); return; }
    return serveStatic(res, filePath);
  }

  // API
  if (pathname.startsWith('/api/')) {
    let handled = false;
    try {
      handled =
        await authRouter(req, res, pathname) ||
        await cardapioRouter(req, res, pathname) ||
        await pedidosRouter(req, res, pathname) ||
        await clientesRouter(req, res, pathname) ||
        await funcionariosRouter(req, res, pathname);
    } catch (err) {
      console.error('[server] erro não tratado:', err);
      if (!res.headersSent) {
        sendJSON(res, 500, { erro: 'Erro interno do servidor.' });
      }
      return;
    }
    if (!handled && !res.headersSent) {
      sendJSON(res, 404, { erro: 'Rota não encontrada.' });
    }
    return;
  }

  // Páginas HTML
  const pageFile = PAGE_ROUTES[pathname];
  if (pageFile) {
    return serveStatic(res, path.join(VIEWS_DIR, pageFile));
  }

  notFound(res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🍕  Pizza Planet rodando em http://localhost:${PORT}`);
});

process.on('uncaughtException',  err => console.error('[uncaughtException]', err));
process.on('unhandledRejection', err => console.error('[unhandledRejection]', err));
