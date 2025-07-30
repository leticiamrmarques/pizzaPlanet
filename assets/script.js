//SLIDE DESTAQUES

document.addEventListener("DOMContentLoaded", function () {
  const slideContainer = document.getElementById("slide-destaque");
  if (!slideContainer) return; // Sai se não estiver na página

  const slides = slideContainer.querySelectorAll(".pizzas-destaque");
  const setaEsquerda = document.getElementById("setaEsquerda-destaques");
  const setaDireita = document.getElementById("setaDireita-destaques");

  if (slides.length === 0 || !setaEsquerda || !setaDireita) return;

  let slideAtual = 0;

  function mostrarSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("destaque-ativo", i === index);
    });
  }

  setaDireita.addEventListener("click", () => {
    slideAtual = (slideAtual + 1) % slides.length;
    mostrarSlide(slideAtual);
  });

  setaEsquerda.addEventListener("click", () => {
    slideAtual = (slideAtual - 1 + slides.length) % slides.length;
    mostrarSlide(slideAtual);
  });

  mostrarSlide(slideAtual); // Mostra o primeiro slide ao carregar
});


//SLIDE AVALIAÇÕES
document.addEventListener("DOMContentLoaded", function () {
  const slideContainer = document.getElementById("slide-avaliacoes");

  // Só executa se o slide existir na página
  if (slideContainer) {
    const botoes = {
      esquerda: document.getElementById("setaEsquerda-avaliacao"),
      direita: document.getElementById("setaDireita-avaliacao")
    };

    const slides = slideContainer.querySelectorAll(".avaliacoes-destaque");
    let indiceAtual = 0;

    function mostrarSlide(indice) {
      slides.forEach((slide, i) => {
        slide.classList.remove("avaliacoes-ativo");
        slide.style.opacity = "0";
        slide.style.display = "none";
      });

      slides[indice].style.display = "flex";
      setTimeout(() => {
        slides[indice].style.opacity = "1";
        slides[indice].classList.add("avaliacoes-ativo");
      }, 50);
    }

    // Proteção para garantir que os botões existem
    if (botoes.direita && botoes.esquerda) {
      botoes.direita.addEventListener("click", () => {
        indiceAtual = (indiceAtual + 1) % slides.length;
        mostrarSlide(indiceAtual);
      });

      botoes.esquerda.addEventListener("click", () => {
        indiceAtual = (indiceAtual - 1 + slides.length) % slides.length;
        mostrarSlide(indiceAtual);
      });
    }

    mostrarSlide(indiceAtual); // Exibe o primeiro slide ao carregar
  }
});


//SLIDES PIZZAS SALGADAS



document.addEventListener("DOMContentLoaded", function () {
  const slideSalgadas = document.getElementById("slide-salgadas");

  if (slideSalgadas) {
    const botoes = {
      esquerda: document.getElementById("setaEsquerda-salgadas"),
      direita: document.getElementById("setaDireita-salgadas")
    };

    const grupos = slideSalgadas.querySelectorAll(".pizzas-salgadas");
    let indiceAtual = 0;

    function mostrarGrupo(indice) {
      grupos.forEach((grupo) => {
        grupo.classList.remove("salgadas-ativo");
        grupo.style.opacity = "0";
        grupo.style.display = "none";
      });

      grupos[indice].style.display = "grid";
      setTimeout(() => {
        grupos[indice].style.opacity = "1";
        grupos[indice].classList.add("salgadas-ativo");
      }, 50);
    }

    if (botoes.direita && botoes.esquerda) {
      botoes.direita.addEventListener("click", () => {
        indiceAtual = (indiceAtual + 1) % grupos.length;
        mostrarGrupo(indiceAtual);
      });

      botoes.esquerda.addEventListener("click", () => {
        indiceAtual = (indiceAtual - 1 + grupos.length) % grupos.length;
        mostrarGrupo(indiceAtual);
      });
    }

    mostrarGrupo(indiceAtual);
  }
});


//SLIDES PIZZAS DOCES

document.addEventListener("DOMContentLoaded", function () {
  const slideDoces = document.getElementById("slide-doces");

  if (slideDoces) {
    const botoes = {
      esquerda: document.getElementById("setaEsquerda-doces"),
      direita: document.getElementById("setaDireita-doces")
    };

    const grupos = slideDoces.querySelectorAll(".pizzas-doces");
    let indiceAtual = 0;

    function mostrarGrupo(indice) {
      grupos.forEach((grupo) => {
        grupo.classList.remove("doces-ativo");
        grupo.style.opacity = "0";
        grupo.style.display = "none";
      });

      grupos[indice].style.display = "grid";
      setTimeout(() => {
        grupos[indice].style.opacity = "1";
        grupos[indice].classList.add("doces-ativo");
      }, 50);
    }

    if (botoes.direita && botoes.esquerda) {
      botoes.direita.addEventListener("click", () => {
        indiceAtual = (indiceAtual + 1) % grupos.length;
        mostrarGrupo(indiceAtual);
      });

      botoes.esquerda.addEventListener("click", () => {
        indiceAtual = (indiceAtual - 1 + grupos.length) % grupos.length;
        mostrarGrupo(indiceAtual);
      });
    }

    mostrarGrupo(indiceAtual);
  }
});


//OVERLAY CARRINHO DE COMPRA
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('overlay-carrinho');
  const btnFechar = document.querySelector('.fechar-overlay');
  const tamanhoPizza = document.getElementById('tamanho-pizza');
  const maxSaboresSpan = document.getElementById('max-sabores');
  const saboresCheckboxes = document.querySelectorAll('input[name="sabores"]');
  const tipoBebida = document.getElementById('tipo-bebida');
  const tamanhoBebida = document.getElementById('tamanho-bebida');
  const saborBebida = document.getElementById('sabor-bebida');
  const inputCep = document.getElementById('cep');
  const nome = document.getElementById('nome');
  const endereco = document.getElementById('endereco');
  const telefone = document.getElementById('telefone');
  const pagamento = document.getElementById('pagamento');
  const form = document.getElementById('form-carrinho');

  let maxSabores = 0;

  tamanhoPizza.addEventListener('change', () => {
    const op = tamanhoPizza.options[tamanhoPizza.selectedIndex];
    maxSabores = parseInt(op.dataset.sabores) || 0;
    maxSaboresSpan.textContent = maxSabores;

    saboresCheckboxes.forEach(checkbox => checkbox.checked = false);
  });

  saboresCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const selecionados = Array.from(saboresCheckboxes).filter(cb => cb.checked);
      if (selecionados.length > maxSabores) {
        checkbox.checked = false;
        alert(`Você pode escolher no máximo ${maxSabores} sabor(es).`);
      }
    });
  });

  tipoBebida.addEventListener('change', () => {
    const tipo = tipoBebida.value;
    if (tipo === '') {
      tamanhoBebida.disabled = true;
      saborBebida.disabled = true;
      tamanhoBebida.innerHTML = '<option value="">Selecione o tamanho</option>';
      saborBebida.innerHTML = '<option value="">Selecione o sabor</option>';
      return;
    }

    tamanhoBebida.disabled = false;
    saborBebida.disabled = false;

    if (tipo === 'suco') {
      tamanhoBebida.innerHTML = `
        <option value="500ml">500 ml - R$ 8,00</option>
        <option value="1l">1L - R$ 15,00</option>
        <option value="1.5l">1,5L - R$ 22,00</option>
      `;
      saborBebida.innerHTML = `
        <option value="abacaxi">Abacaxi</option>
        <option value="acerola">Acerola</option>
        <option value="caja">Cajá</option>
        <option value="goiaba">Goiaba</option>
        <option value="laranja">Laranja</option>
        <option value="limao">Limão</option>
        <option value="manga">Manga</option>
        <option value="maracuja">Maracujá</option>
        <option value="morango">Morango</option>
        <option value="uva">Uva</option>
      `;
    } else if (tipo === 'refrigerante') {
      tamanhoBebida.innerHTML = `
        <option value="350ml">350 ml - R$ 6,00</option>
        <option value="600ml">600 ml - R$ 10,00</option>
        <option value="1l">1L - R$ 12,00</option>
        <option value="1.5l">1,5L - R$ 16,00</option>
        <option value="2l">2L - R$ 18,00</option>
      `;
      saborBebida.innerHTML = `
        <option value="coca">Coca-Cola</option>
        <option value="coca-zero">Coca-Cola Zero</option>
        <option value="fanta-laranja">Fanta Laranja</option>
        <option value="fanta-uva">Fanta Uva</option>
        <option value="fanta-guarana">Fanta Guaraná</option>
        <option value="pepsi">Pepsi</option>
        <option value="schweppes">Schweppes Citrus</option>
        <option value="sprite">Sprite Limão</option>
      `;
    }
  });

  btnFechar.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  // Agora abrange .hover-effect-card e .fazer-pedido
  document.querySelectorAll('a.hover-effect-card, .fazer-pedido').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      overlay.classList.remove('hidden');

      // Resetar formulário
      form.reset();
      maxSaboresSpan.textContent = '0';
      tamanhoBebida.disabled = true;
      saborBebida.disabled = true;
      tamanhoBebida.innerHTML = '<option value="">Selecione o tamanho</option>';
      saborBebida.innerHTML = '<option value="">Selecione o sabor</option>';
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cep = inputCep.value.trim();
    const tamanho = tamanhoPizza.value;
    const borda = document.getElementById('borda-pizza').value;
    const sabores = Array.from(saboresCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    const bebidaTipo = tipoBebida.value;
    const bebidaTamanho = tamanhoBebida.value;
    const bebidaSabor = saborBebida.value;

    if (!cep) {
      alert('Por favor, informe o CEP.');
      return;
    }
    if (!tamanho) {
      alert('Por favor, selecione o tamanho da pizza.');
      return;
    }
    if (sabores.length === 0) {
      alert('Selecione ao menos 1 sabor.');
      return;
    }
    if (!nome.value.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    if (!endereco.value.trim()) {
      alert('Por favor, informe seu endereço.');
      return;
    }
    if (!telefone.value.trim()) {
      alert('Por favor, informe seu telefone.');
      return;
    }
    if (!pagamento.value) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    alert(`Pedido:
Nome: ${nome.value}
Endereço: ${endereco.value}
Telefone: ${telefone.value}
CEP: ${cep}
Tamanho: ${tamanho}
Sabores: ${sabores.join(', ')}
Borda: ${borda}
Bebida: ${bebidaTipo ? bebidaTipo + ' - ' + bebidaTamanho + ' - ' + bebidaSabor : 'Nenhuma'}
Forma de pagamento: ${pagamento.value}`);

    overlay.classList.add('hidden');
  });
});
