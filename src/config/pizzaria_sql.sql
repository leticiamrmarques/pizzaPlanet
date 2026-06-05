-- Schema: Sistema de Pedidos de Pizzaria
-- Banco de dados: MySQL

CREATE DATABASE pizzaria;
USE pizzaria;

-- ====== Pessoas e autenticação ======

-- Dados comuns a qualquer usuário do sistema (cliente, entregador ou funcionário)
CREATE TABLE pessoa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(120) NOT NULL,
  nome_social VARCHAR(120),
  email VARCHAR(150) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  login VARCHAR(80) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Perfil de cliente — liga à tabela pessoa
CREATE TABLE cliente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pessoa_id INT UNIQUE NOT NULL
);

-- Perfil de entregador com dados do veículo
CREATE TABLE entregador (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pessoa_id INT UNIQUE NOT NULL,
  cnh VARCHAR(20) NOT NULL,
  placa_veiculo VARCHAR(10) NOT NULL,
  foto_url VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Conta bancária para repasse ao entregador (pode ter mais de uma)
CREATE TABLE conta_bancaria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entregador_id INT NOT NULL,
  banco VARCHAR(80) NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  conta VARCHAR(20) NOT NULL,
  tipo ENUM('corrente', 'poupança') NOT NULL
);

-- Funcionário interno (atendente, gerente, etc.) — não é cliente nem entregador
CREATE TABLE funcionario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pessoa_id INT UNIQUE NOT NULL,
  cargo VARCHAR(60), -- ex: atendente, gerente
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Papéis que um funcionário pode ter; um funcionário pode ter mais de um
CREATE TABLE funcionario_role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  funcionario_id INT NOT NULL,
  role ENUM('cardapio', 'pedidos', 'admin') NOT NULL,
  UNIQUE KEY uq_funcionario_role (funcionario_id, role)
);
-- cardapio: gerencia itens, preços e disponibilidade do cardápio
-- pedidos: aprova, rejeita e acompanha pedidos
-- admin: acesso total, inclui gerenciar funcionários

-- ====== Endereços e formas de pagamento do cliente ====== 

-- Endereços cadastrados pelo cliente; principal = endereço padrão
CREATE TABLE cliente_endereco (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  cep VARCHAR(9) NOT NULL,
  logradouro VARCHAR(150) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  complemento VARCHAR(80),
  bairro VARCHAR(80) NOT NULL,
  cidade VARCHAR(80) NOT NULL,
  estado CHAR(2) NOT NULL,
  ponto_referencia VARCHAR(150),
  principal BOOLEAN NOT NULL DEFAULT FALSE
);

-- Formas de pagamento salvas; principal = método padrão
CREATE TABLE cliente_forma_pagamento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  tipo ENUM('cartao_credito', 'cartao_debito', 'pix') NOT NULL,
  token_gateway VARCHAR(255), -- token retornado pelo gateway (cartão)
  bandeira VARCHAR(30), -- Visa, Mastercard, etc.
  ultimos_digitos CHAR(4),
  chave_pix VARCHAR(150), -- CPF, e-mail, telefone ou chave aleatória
  principal BOOLEAN NOT NULL DEFAULT FALSE
);

-- ====== Cardápio: pizzas ====== 

-- Tamanhos de pizza com limite de sabores e preço base
CREATE TABLE pizza_tamanho (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(20) NOT NULL, -- broto, media, grande, gigante
  max_sabores INT NOT NULL, -- 1, 2, 3 ou 4
  preco DECIMAL(8,2) NOT NULL,
  disponivel BOOLEAN NOT NULL DEFAULT TRUE
);

-- Sabores disponíveis, separados em salgados e doces
CREATE TABLE pizza_sabor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(60) NOT NULL,
  descricao VARCHAR(255),
  categoria ENUM('salgado', 'doce') NOT NULL,
  disponivel BOOLEAN NOT NULL DEFAULT TRUE
);

-- Opções de borda recheada com preço adicional
CREATE TABLE pizza_borda (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(40) NOT NULL, -- catupiry, cheddar, nutella
  preco DECIMAL(8,2) NOT NULL, -- catupiry/cheddar = 6.00, nutella = 10.00
  disponivel BOOLEAN NOT NULL DEFAULT TRUE
);

-- ====== Cardápio: bebidas ====== 

-- Categorias de bebida (suco, refrigerante, etc.)
CREATE TABLE bebida_tipo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(30) NOT NULL
);

-- Sabores por tipo de bebida (ex: laranja para suco)
CREATE TABLE bebida_sabor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bebida_tipo_id INT NOT NULL,
  nome VARCHAR(60) NOT NULL
);

-- Volumes disponíveis por tipo de bebida, cada um com seu preço
CREATE TABLE bebida_volume (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bebida_tipo_id INT NOT NULL,
  volume_ml INT NOT NULL,
  preco DECIMAL(8,2) NOT NULL
);

-- Combinação sabor + volume disponível para venda
CREATE TABLE bebida_disponivel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sabor_id INT NOT NULL,
  volume_id INT NOT NULL,
  disponivel BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_bebida_sabor_volume (sabor_id, volume_id)
);

-- ====== Pedidos ====== 

-- Cabeçalho do pedido com valores e status de pagamento
CREATE TABLE pedido (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  entregador_id INT, -- atribuído somente após pagamento confirmado
  endereco_id INT NOT NULL,
  tipo_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL,
  observacao_pagamento VARCHAR(255),
  status_pagamento ENUM('pendente', 'pago', 'estornado') NOT NULL DEFAULT 'pendente',
  referencia_pagamento VARCHAR(255), -- ID da transação no gateway ou txid Pix
  valor_itens DECIMAL(10,2) NOT NULL,
  valor_frete DECIMAL(8,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Histórico de mudanças de status; funcionario_id registra quem fez a ação (NULL = sistema)
CREATE TABLE pedido_status_historico (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  funcionario_id INT, -- NULL quando a mudança é automática (ex: confirmação de pagamento)
  status ENUM('aguardando_aprovacao', 'em_producao', 'saiu_para_entrega', 'entregue', 'cancelado') NOT NULL,
  alterado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  observacao VARCHAR(255)
);

-- Item de pizza dentro de um pedido (tamanho + borda + quantidade)
CREATE TABLE pedido_item_pizza (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  tamanho_id INT NOT NULL,
  borda_id INT, -- NULL = sem borda
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(8,2) NOT NULL, -- preço do tamanho no momento do pedido
  valor_borda DECIMAL(8,2) NOT NULL DEFAULT 0 -- preço da borda no momento do pedido
);

-- Sabores escolhidos para cada item de pizza (até max_sabores do tamanho)
CREATE TABLE pedido_item_pizza_sabor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_item_pizza_id INT NOT NULL,
  sabor_id INT NOT NULL
);

-- Item de bebida dentro de um pedido
CREATE TABLE pedido_item_bebida (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  bebida_disponivel_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(8,2) NOT NULL -- preço no momento do pedido
);

-- ====== Foreign keys ====== 

ALTER TABLE cliente
  ADD CONSTRAINT fk_cliente_pessoa
  FOREIGN KEY (pessoa_id) REFERENCES pessoa (id);

ALTER TABLE entregador
  ADD CONSTRAINT fk_entregador_pessoa
  FOREIGN KEY (pessoa_id) REFERENCES pessoa (id);

ALTER TABLE conta_bancaria
  ADD CONSTRAINT fk_conta_entregador
  FOREIGN KEY (entregador_id) REFERENCES entregador (id);

ALTER TABLE funcionario
  ADD CONSTRAINT fk_funcionario_pessoa
  FOREIGN KEY (pessoa_id) REFERENCES pessoa (id);

ALTER TABLE funcionario_role
  ADD CONSTRAINT fk_role_funcionario
  FOREIGN KEY (funcionario_id) REFERENCES funcionario (id);

ALTER TABLE cliente_endereco
  ADD CONSTRAINT fk_endereco_cliente
  FOREIGN KEY (cliente_id) REFERENCES cliente (id);

ALTER TABLE cliente_forma_pagamento
  ADD CONSTRAINT fk_pagamento_cliente
  FOREIGN KEY (cliente_id) REFERENCES cliente (id);

ALTER TABLE bebida_sabor
  ADD CONSTRAINT fk_bebida_sabor_tipo
  FOREIGN KEY (bebida_tipo_id) REFERENCES bebida_tipo (id);

ALTER TABLE bebida_volume
  ADD CONSTRAINT fk_bebida_volume_tipo
  FOREIGN KEY (bebida_tipo_id) REFERENCES bebida_tipo (id);

ALTER TABLE bebida_disponivel
  ADD CONSTRAINT fk_bebida_disp_sabor
  FOREIGN KEY (sabor_id) REFERENCES bebida_sabor (id);

ALTER TABLE bebida_disponivel
  ADD CONSTRAINT fk_bebida_disp_volume
  FOREIGN KEY (volume_id) REFERENCES bebida_volume (id);

ALTER TABLE pedido
  ADD CONSTRAINT fk_pedido_cliente
  FOREIGN KEY (cliente_id) REFERENCES cliente (id);

ALTER TABLE pedido
  ADD CONSTRAINT fk_pedido_entregador
  FOREIGN KEY (entregador_id) REFERENCES entregador (id);

ALTER TABLE pedido
  ADD CONSTRAINT fk_pedido_endereco
  FOREIGN KEY (endereco_id) REFERENCES cliente_endereco (id);

ALTER TABLE pedido_status_historico
  ADD CONSTRAINT fk_historico_pedido
  FOREIGN KEY (pedido_id) REFERENCES pedido (id);

ALTER TABLE pedido_status_historico
  ADD CONSTRAINT fk_historico_funcionario
  FOREIGN KEY (funcionario_id) REFERENCES funcionario (id);

ALTER TABLE pedido_item_pizza
  ADD CONSTRAINT fk_item_pizza_pedido
  FOREIGN KEY (pedido_id) REFERENCES pedido (id);

ALTER TABLE pedido_item_pizza
  ADD CONSTRAINT fk_item_pizza_tamanho
  FOREIGN KEY (tamanho_id) REFERENCES pizza_tamanho (id);

ALTER TABLE pedido_item_pizza
  ADD CONSTRAINT fk_item_pizza_borda
  FOREIGN KEY (borda_id) REFERENCES pizza_borda (id);

ALTER TABLE pedido_item_pizza_sabor
  ADD CONSTRAINT fk_pizza_sabor_item
  FOREIGN KEY (pedido_item_pizza_id) REFERENCES pedido_item_pizza (id);

ALTER TABLE pedido_item_pizza_sabor
  ADD CONSTRAINT fk_pizza_sabor_sabor
  FOREIGN KEY (sabor_id) REFERENCES pizza_sabor (id);

ALTER TABLE pedido_item_bebida
  ADD CONSTRAINT fk_item_bebida_pedido
  FOREIGN KEY (pedido_id) REFERENCES pedido (id);

ALTER TABLE pedido_item_bebida
  ADD CONSTRAINT fk_item_bebida_disp
  FOREIGN KEY (bebida_disponivel_id) REFERENCES bebida_disponivel (id);


-- ====== Cardápio inicial da pizzaria ====== 

-- Pizza: tamanhos
-- max_sabores: broto=1, media=2, grande=3, gigante=4

INSERT INTO pizza_tamanho (nome, max_sabores, preco) VALUES
  ('broto', 1, 42.90),
  ('média', 2, 57.90),
  ('grande', 3, 68.90),
  ('gigante', 4, 85.90);

-- Pizza: sabores
INSERT INTO pizza_sabor (nome, descricao, categoria) VALUES
  ('Calabresa', 'Molho de tomate, muçarela, linguiça calabresa, cebola, azeitonas pretas e orégano.', 'salgado'),
  ('Mussarela', 'Molho de tomate, muçarela fresca, manjericão e orégano.', 'salgado'),
  ('Portuguesa', 'Molho de tomate, muçarela, presunto, cebola, ovos cozidos, azeitonas pretas e orégano.', 'salgado'),
  ('Frango com Catupiry', 'Molho de tomate, muçarela, peito de frango temperado e desfiado, Catupiry e orégano.', 'salgado'),
  ('Quatro Queijos', 'Molho de tomate, muçarela, catupiry, gorgonzola ralado, parmesão e orégano.', 'salgado'),
  ('Marguerita', 'Molho de tomate, muçarela, tomate cereja, parmesão ralado, manjericão e orégano.', 'salgado'),
  ('Lombo', 'Molho de tomate, muçarela, lombo canadense fatiado, queijo parmesão e orégano.', 'salgado'),
  ('Affumacita', 'Rodelas de tomate caqui, muçarela de búfala defumada ralada, azeitonas pretas fatiadas, salpicado com alecrim.', 'salgado'),
  ('Chocolate', 'Massa crocante, chocolate meio amargo com bombom sonho de valsa picado.', 'doce'),
  ('Banana com Canela', 'Muçarela, banana, canela e açúcar, borrifada levemente com rum.', 'doce'),
  ('Romeu e Julieta', 'Calda de goiabada e fatias de queijo coalho.', 'doce'),
  ('Chocolate com Morango', 'Massa crocante, chocolate meio amargo com pedaços de morango.', 'doce');

-- Pizza: bordas
INSERT INTO pizza_borda (nome, preco) VALUES
  ('catupiry', 6.00),
  ('cheddar', 6.00),
  ('nutella', 10.00);

-- Bebidas: tipos
INSERT INTO bebida_tipo (nome) VALUES
  ('suco natural'), -- id 1
  ('refrigerante'); -- id 2

-- Bebidas: sabores
-- Sucos (bebida_tipo_id = 1)
INSERT INTO bebida_sabor (bebida_tipo_id, nome) VALUES
  (1, 'Abacaxi'),
  (1, 'Acerola'),
  (1, 'Cajá'),
  (1, 'Goiaba'),
  (1, 'Laranja'),
  (1, 'Limão'),
  (1, 'Manga'),
  (1, 'Maracujá'),
  (1, 'Morango'),
  (1, 'Uva');

-- Refrigerantes (bebida_tipo_id = 2)
INSERT INTO bebida_sabor (bebida_tipo_id, nome) VALUES
  (2, 'Coca-Cola'),
  (2, 'Coca-Cola Zero'),
  (2, 'Fanta Laranja'),
  (2, 'Fanta Uva'),
  (2, 'Fanta Guaraná'),
  (2, 'Pepsi'),
  (2, 'Schweppes Citrus'),
  (2, 'Sprite Limão');

-- Bebidas: volumes
-- Sucos (bebida_tipo_id = 1)
INSERT INTO bebida_volume (bebida_tipo_id, volume_ml, preco) VALUES
  (1, 500, 8.00),
  (1, 1000, 15.00),
  (1, 1500, 22.00);

-- Refrigerantes (bebida_tipo_id = 2)
INSERT INTO bebida_volume (bebida_tipo_id, volume_ml, preco) VALUES
  (2, 350, 6.00),
  (2, 600, 10.00),
  (2, 1000, 12.00),
  (2, 1500, 16.00),
  (2, 2000, 18.00);

-- Bebidas: disponibilidade (todas as combinações sabor × volume)
INSERT INTO bebida_disponivel (sabor_id, volume_id)
-- sucos: 10 sabores × 3 volumes = 30 combinações
SELECT s.id, v.id
FROM bebida_sabor s
JOIN bebida_volume v ON v.bebida_tipo_id = s.bebida_tipo_id
WHERE s.bebida_tipo_id = 1

UNION ALL

-- refrigerantes: 8 sabores × 5 volumes = 40 combinações
SELECT s.id, v.id
FROM bebida_sabor s
JOIN bebida_volume v ON v.bebida_tipo_id = s.bebida_tipo_id
WHERE s.bebida_tipo_id = 2;

-- ====== Seed: Funcionários e entregadores ====== 

-- Pessoas
-- funcionários: ids 1-10 / entregadores: ids 11-20
-- hashes da senha 123456 para todos

INSERT INTO pessoa (cpf, nome, email, telefone, login, senha_hash) VALUES
  ('111.111.111-01', 'Ana Paula Ferreira', 'ana.ferreira@pizzaria.com', '(11) 91111-0001', 'ana.ferreira', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-02', 'Carlos Eduardo Lima', 'carlos.lima@pizzaria.com', '(11) 91111-0002', 'carlos.lima', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-03', 'Fernanda Souza', 'fernanda.souza@pizzaria.com', '(11) 91111-0003', 'fernanda.souza', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-04', 'Marcos Oliveira', 'marcos.oliveira@pizzaria.com', '(11) 91111-0004', 'marcos.oliveira', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-05', 'Juliana Costa', 'juliana.costa@pizzaria.com', '(11) 91111-0005', 'juliana.costa', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-06', 'Ricardo Alves', 'ricardo.alves@pizzaria.com', '(11) 91111-0006', 'ricardo.alves', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-07', 'Patrícia Mendes', 'patricia.mendes@pizzaria.com', '(11) 91111-0007', 'patricia.mendes', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-08', 'Diego Rocha', 'diego.rocha@pizzaria.com', '(11) 91111-0008', 'diego.rocha', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-09', 'Camila Nunes', 'camila.nunes@pizzaria.com', '(11) 91111-0009', 'camila.nunes', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('111.111.111-10', 'Bruno Carvalho', 'bruno.carvalho@pizzaria.com', '(11) 91111-0010', 'bruno.carvalho', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-01', 'Rafael Pereira', 'rafael.pereira@pizzaria.com', '(11) 92222-0001', 'rafael.pereira', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-02', 'Thiago Barbosa', 'thiago.barbosa@pizzaria.com', '(11) 92222-0002', 'thiago.barbosa', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-03', 'Larissa Martins', 'larissa.martins@pizzaria.com', '(11) 92222-0003', 'larissa.martins', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-04', 'Felipe Nascimento', 'felipe.nasc@pizzaria.com', '(11) 92222-0004', 'felipe.nasc', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-05', 'Aline Ribeiro', 'aline.ribeiro@pizzaria.com', '(11) 92222-0005', 'aline.ribeiro', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-06', 'Eduardo Gomes', 'eduardo.gomes@pizzaria.com', '(11) 92222-0006', 'eduardo.gomes', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-07', 'Vanessa Teixeira', 'vanessa.teixeira@pizzaria.com', '(11) 92222-0007', 'vanessa.teixeira', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-08', 'Leonardo Santos', 'leonardo.santos@pizzaria.com', '(11) 92222-0008', 'leonardo.santos', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-09', 'Gabriela Freitas', 'gabriela.freitas@pizzaria.com', '(11) 92222-0009', 'gabriela.freitas', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO'),
  ('222.222.222-10', 'Henrique Castro', 'henrique.castro@pizzaria.com', '(11) 92222-0010', 'henrique.castro', '$2b$10$4tPhJMf/YXf5H1Zi15e3nOVHEUHKVWyV3q/vzHIPTljtU4a5cE0WO');

-- Funcionários (pessoa_id 1-10)
INSERT INTO funcionario (pessoa_id, cargo) VALUES
  (1, 'gerente'),
  (2, 'atendente'),
  (3, 'atendente'),
  (4, 'atendente'),
  (5, 'caixa'),
  (6, 'caixa'),
  (7, 'supervisor'),
  (8, 'atendente'),
  (9, 'atendente'),
  (10, 'gerente');

-- Roles dos funcionários
-- gerente/supervisor: admin + pedidos + cardapio
-- atendente/caixa: pedidos

INSERT INTO funcionario_role (funcionario_id, role) VALUES
  (1, 'admin'), (1, 'pedidos'), (1, 'cardapio'), -- Ana Paula (gerente)
  (2, 'pedidos'), -- Carlos (atendente)
  (3, 'pedidos'), -- Fernanda (atendente)
  (4, 'pedidos'), -- Marcos (atendente)
  (5, 'pedidos'), -- Juliana (caixa)
  (6, 'pedidos'), -- Ricardo (caixa)
  (7, 'admin'), (7, 'pedidos'), (7, 'cardapio'), -- Patrícia (supervisora)
  (8, 'pedidos'), -- Diego (atendente)
  (9, 'pedidos'), -- Camila (atendente)
  (10, 'admin'), (10, 'pedidos'), (10, 'cardapio'); -- Bruno (gerente)

-- Entregadores (pessoa_id 11-20)
INSERT INTO entregador (pessoa_id, cnh, placa_veiculo, foto_url) VALUES
  (11, '00111222201', 'ABC-1234', NULL),
  (12, '00111222202', 'DEF-5678', NULL),
  (13, '00111222203', 'GHI-9012', NULL),
  (14, '00111222204', 'JKL-3456', NULL),
  (15, '00111222205', 'MNO-7890', NULL),
  (16, '00111222206', 'PQR-1122', NULL),
  (17, '00111222207', 'STU-3344', NULL),
  (18, '00111222208', 'VWX-5566', NULL),
  (19, '00111222209', 'YZA-7788', NULL),
  (20, '00111222210', 'BCD-9900', NULL);

-- Contas bancárias dos entregadores (entregador_id 1-10)
INSERT INTO conta_bancaria (entregador_id, banco, agencia, conta, tipo) VALUES
  (1, 'Nubank', '0001', '12345678-9', 'corrente'),
  (2, 'Itaú', '3456', '98765432-1', 'corrente'),
  (3, 'Bradesco', '1234', '11223344-5', 'poupança'),
  (4, 'Caixa', '0987', '55667788-0', 'corrente'),
  (5, 'Nubank', '0001', '22334455-6', 'corrente'),
  (6, 'Santander', '2233', '44556677-8', 'corrente'),
  (7, 'Inter', '0001', '33445566-7', 'corrente'),
  (8, 'Bradesco', '5678', '66778899-1', 'poupança'),
  (9, 'Itaú', '8765', '77889900-2', 'corrente'),
  (10, 'Banco do Brasil', '4321', '88990011-3', 'corrente');
