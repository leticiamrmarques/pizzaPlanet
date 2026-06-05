<div align="center">

# 🍕 Pizza Planet
**Sistema on-line de delivery de pizzas**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</div>

---

Sistema web completo de pedidos para pizzaria, desenvolvido com **Node.js** e **MySQL**. Permite que clientes montem e finalizem pedidos online, e que funcionários gerenciem cardápio, clientes, pedidos e entregas por um painel administrativo.<br>
**Protótipo:** [Figma](https://www.figma.com/proto/e32V9OAjL0FLDozsEt0WpX/Pizza-Planet?node-id=1-2&p=f&t=BHml5i9IKOSUea3k-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2)<br>
**Modelo Lógico do Banco de Dados:** [DBDiagram](https://dbdiagram.io/d/Pizzaria-6a1eca702eeb2f46cd412c2c)

---

## ✨ Funcionalidades

### Área do Cliente
- Visualização do cardápio com pizzas salgadas, doces e bebidas
- Montagem de pedido: escolha de tamanho, sabores (com limite por tamanho), borda e bebidas
- Carrinho persistido no `localStorage`
- Finalização de pedido com seleção de endereço e forma de pagamento (Pix, cartão, dinheiro com troco)
- Acompanhamento de pedidos na conta

### Área Administrativa (Funcionários)
- Painel de pedidos com atualização de status (aguardando → em produção → saiu para entrega → entregue)
- Gerenciamento de cardápio (pizzas e bebidas)
- Gerenciamento de clientes e funcionários
- Painel de entregas para entregadores

### Autenticação
- Login unificado para clientes, funcionários e entregadores
- Controle de perfil e permissões por role (`admin`, `pedidos`, etc.)
- Sessões via cookie seguro

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js (sem framework) |
| Banco de dados | MySQL |
| Front-end | HTML, CSS e JavaScript puro |
| Autenticação | bcryptjs + sessão em cookie |
| Ambiente | dotenv via `utils/env.js` |

---

## 📁 Estrutura do Projeto

```
pizzaria_LeticiaMarques/
├── src/
│   ├── config/
│   │   ├── db.js               # Conexão com o MySQL
│   │   ├── session.js          # Gerenciamento de sessões
│   │   └── pizzaria_sql.sql    # Script completo do banco de dados
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cardapioController.js
│   │   ├── clienteController.js
│   │   ├── funcionarioController.js
│   │   └── pedidoController.js
│   ├── middlewares/
│   │   └── auth.js             # Verificação de sessão e permissões
│   ├── models/
│   │   ├── authModel.js
│   │   ├── cardapioModel.js
│   │   ├── clienteModel.js
│   │   ├── funcionarioModel.js
│   │   └── pedidoModel.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cardapio.js
│   │   ├── clientes.js
│   │   ├── funcionarios.js
│   │   └── pedidos.js
│   ├── utils/
│   │   ├── env.js              # Carregamento de variáveis de ambiente
│   │   └── http.js             # Helpers de requisição/resposta HTTP
│   ├── views/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/                # Imagens do cardápio e interface
│   │   ├── js/
│   │   │   ├── app.js          # Sessão, login, toast e utilitários globais
│   │   │   └── cardapio.js     # Lógica do cardápio e carrinho
│   │   └── pages/
│   │       ├── home.html
│   │       ├── cardapio.html
│   │       ├── cadastro.html
│   │       ├── minha-conta.html
│   │       ├── meu-perfil.html
│   │       ├── painel-pedidos.html
│   │       ├── painel-cardapio.html
│   │       ├── painel-clientes.html
│   │       ├── painel-funcionarios.html
│   │       └── painel-entregas.html
│   └── server.js               # Entrada da aplicação, servidor HTTP e roteamento
├── .env                        # Variáveis de ambiente (não versionar)
├── .gitignore
└── package.json
```

---

## 🗄️ Banco de Dados

O banco é **MySQL**. O script completo de criação está em `src/config/pizzaria_sql.sql` e já inclui as tabelas, chaves estrangeiras e dados iniciais do cardápio.

**Principais tabelas:**

| Grupo | Tabelas |
|---|---|
| Usuários | `pessoa`, `cliente`, `funcionario`, `funcionario_role`, `entregador` |
| Endereços | `cliente_endereco`, `cliente_forma_pagamento` |
| Cardápio — Pizzas | `pizza_tamanho`, `pizza_sabor`, `pizza_borda` |
| Cardápio — Bebidas | `bebida_tipo`, `bebida_sabor`, `bebida_volume`, `bebida_disponivel` |
| Pedidos | `pedido`, `pedido_status_historico`, `pedido_item_pizza`, `pedido_item_pizza_sabor`, `pedido_item_bebida` |

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [MySQL](https://www.mysql.com/) 8.0 ou superior

### 1. Clone o repositório

```bash
git clone https://github.com/leticiamrmarques/pizzaPlanet.git
cd pizzaria_LeticiaMarques
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Crie o banco e execute o script SQL:

```bash
mysql -u root -p < src/config/pizzaria_sql.sql
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=pizzaria
PORT=3000
SESSION_SECRET=uma_chave_secreta_qualquer
```

### 5. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev
```

Acesse em: **http://localhost:3000**

---

## 🔑 Perfis de acesso

| Perfil | Acesso |
|---|---|
| **Cliente** | Cardápio, carrinho, finalização de pedidos, histórico |
| **Funcionário** | Painel de pedidos, cardápio, clientes e funcionários (conforme roles) |
| **Entregador** | Painel de entregas, confirmação de entrega e pagamento |

---

## 👩‍💻 Autora

Desenvolvido por **Letícia Marques** como projeto da disciplina de Programação para Web — IFB, 3º período do curso Técnico em Deesenvolvimento de Sistemas.
- GitHub: [@leticiamrmarques](https://github.com/leticiamrmarques)
- Email: leticiamrmarques@gmail.com
