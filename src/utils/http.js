// Helpers de resposta HTTP reutilizáveis

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHTML(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
  });
  res.end(html);
}

function redirect(res, location, statusCode = 302) {
  res.writeHead(statusCode, { Location: location });
  res.end();
}

function notFound(res) {
  sendHTML(res, 404, '<h1>404 — Página não encontrada</h1>');
}

function methodNotAllowed(res) {
  res.writeHead(405, { Allow: 'GET, POST, PUT, DELETE' });
  res.end();
}

//Lê o corpo da requisição e retorna como objeto (JSON ou form-urlencoded)

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload muito grande'));
      }
    });
    req.on('end', () => {
      const ct = req.headers['content-type'] || '';
      try {
        if (ct.includes('application/json')) {
          resolve(JSON.parse(body));
        } else {
          // application/x-www-form-urlencoded
          const params = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of params.entries()) obj[k] = v;
          resolve(obj);
        }
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Retorna path e querystring separados
function parsePath(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  return { pathname: url.pathname, query: url.searchParams };
}

module.exports = { sendJSON, sendHTML, redirect, notFound, methodNotAllowed, parseBody, parsePath };
