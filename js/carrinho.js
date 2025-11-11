// ===============================
// Carrinho LocalStorage
// ===============================
function getCarrinho() {
    return JSON.parse(localStorage.getItem('carrinho') || '[]');
}

function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function adicionarAoCarrinho(produto) {
    let carrinho = getCarrinho();
    const existente = carrinho.find(p => p.id === produto.id);

    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }

    // ⚡ Se o checkbox de embalagem estiver marcado, atualiza o item de embalagem
    const chkEmbalagem = document.getElementById('chkEmbalagem');
    if (chkEmbalagem && chkEmbalagem.checked) {
        const totalItens = carrinho
            .filter(p => !p.nome.includes('Embalagem'))
            .filter(p => !p.nome.includes('Mensagem'))
            .reduce((acc, p) => acc + p.quantidade, 0);

        let itemEmbalagem = carrinho.find(p => p.nome.includes('Embalagem'));

        if (!itemEmbalagem) {
            const e = window.embalagem; // precisa estar definido no escopo global
            if (e) {
                carrinho.push({
                    id: e.id,
                    nome: e.nome,
                    preco: e.preco,
                    quantidade: totalItens
                });
            }
        } else {
            itemEmbalagem.quantidade = totalItens;
        }
    }

    salvarCarrinho(carrinho);
    alert(`✅ ${produto.nome} adicionado ao carrinho!`);
}


// ===============================
// Dialog de carrinho
// ===============================
function abrirCarrinho() {
    const dialog = document.getElementById('cartDialog');
    const itemsDiv = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    const chkEmbalagem = document.getElementById('chkEmbalagem');

    let carrinho = getCarrinho();

    // Verifica se tem embalagem econômica
    const embalagem = carrinho.find(p => p.nome.includes("Embalagem"));
    chkEmbalagem.checked = !!embalagem;

    if (carrinho.length === 0) {
        itemsDiv.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalDiv.textContent = '';
    } else {
        let total = 0;
        itemsDiv.innerHTML = carrinho
            .map(p => {
                total += p.preco * p.quantidade;
                return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span>${p.nome} (${p.quantidade}x)</span>
            ${!p.nome.includes("Embalagem") && !p.nome.includes("Mensagem") ? `
              <div>
                <button onclick="alterarQtd(${p.id}, -1)">-</button>
                <button onclick="alterarQtd(${p.id}, 1)">+</button>
              </div>` : ''}
          </div>
        `;
            })
            .join('');

        totalDiv.textContent = `Total: R$ ${total.toFixed(2)}`;
    }

    dialog.showModal();
}

function fecharCarrinho() {
    document.getElementById('cartDialog').close();
}

function alterarQtd(id, delta) {
    let carrinho = getCarrinho();
    const item = carrinho.find(p => p.id === id);
    if (!item) return;

    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(p => p.id !== id);
    }

    // ⚡ Atualiza embalagem, se existir
    const embalagem = carrinho.find(p => p.nome.includes('Embalagem'));
    if (embalagem) {
        const totalItens = carrinho
            .filter(p => !p.nome.includes('Embalagem'))
            .filter(p => !p.nome.includes('Mensagem'))
            .reduce((acc, p) => acc + p.quantidade, 0);

        // se o carrinho ficou vazio, remove embalagem e mensagem também
        if (totalItens === 0) {
            carrinho = carrinho.filter(p => !p.nome.includes('Embalagem'));
            carrinho = carrinho.filter(p => !p.nome.includes('Mensagem'));
            const chk = document.getElementById('chkEmbalagem');
            if (chk) chk.checked = false;
        } else {
            embalagem.quantidade = totalItens;
        }
    }

    salvarCarrinho(carrinho);
    abrirCarrinho(); // re-render
}


// ===============================
// Embalagem econômica
// ===============================
function toggleEmbalagem(checked) {
    let carrinho = getCarrinho();
    const embalagem = carrinho.find(p => p.nome.includes('Embalagem'));

    // calcula total de itens (sem contar embalagem e mensagem)
    const totalItens = carrinho
        .filter(p => !p.nome.includes('Embalagem'))
        .filter(p => !p.nome.includes('Mensagem'))
        .reduce((acc, p) => acc + p.quantidade, 0);

    if (checked) {
        if (!embalagem) {
            carrinho.push({
                id: window.embalagem.id,
                nome: window.embalagem.nome,
                preco: window.embalagem.preco,
                quantidade: totalItens
            });
        } else {
            embalagem.quantidade = totalItens;
        }
    } else {
        carrinho = carrinho.filter(p => !p.nome.includes('Embalagem'));
    }

    salvarCarrinho(carrinho);
    abrirCarrinho(); // atualiza tela e total
}


// ===============================
// Finalizar pedido
// ===============================
async function finalizarPedido() {
    const carrinho = getCarrinho();
    if (carrinho.length === 0) return alert('Carrinho vazio!');
    const mensagem = carrinho.find(p => p.nome.includes('Mensagem'));

    const pedido = {
        itens: carrinho.map(p => ({
            produtoId: p.id,
            quantidade: p.quantidade,
            preco: p.preco
        })),
        obs: '',
        endereco: '',
        mensagem: mensagem?.observacao || ''
    };

    try {
        const res = await fetch(`${API_BASE}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pedido)
        });
        const responseJson = await res.json();
        if (!res.ok) throw new Error(responseJson?.message || 'Falha ao enviar pedido');

        alert('🧾 Pedido enviado com sucesso!');

        // limpa carrinho persistido
        localStorage.removeItem('carrinho');

        // ✅ reseta UI dos extras para não ficar marcado no próximo pedido
        const chkEmbalagem = document.getElementById('chkEmbalagem');
        if (chkEmbalagem) chkEmbalagem.checked = false;

        const chkMensagem = document.getElementById('chkMensagem');
        if (chkMensagem) chkMensagem.checked = false;

        const msgInput = document.getElementById('mensagemTexto');
        if (msgInput) msgInput.value = '';

        const wrapper = document.getElementById('mensagemWrapper');
        if (wrapper) wrapper.style.display = 'none';

        fecharCarrinho();
    } catch (e) {
        alert(e.message);
    }
}


// ===============================
// Mensagem personalizada
// ===============================
function toggleMensagem(checked) {
    let carrinho = getCarrinho();
    const itemMensagem = carrinho.find(p => p.nome.includes('Mensagem'));

    const wrapper = document.getElementById('mensagemWrapper');
    wrapper.style.display = checked ? 'block' : 'none';

    if (checked) {
        const texto = document.getElementById('mensagemTexto').value.trim();
        if (!itemMensagem) {
            carrinho.push({
                id: window.produtoMensagem.id,
                nome: window.produtoMensagem.nome,
                preco: window.produtoMensagem.preco,
                quantidade: 1,
                observacao: texto
            });
        } else {
            itemMensagem.observacao = texto;
        }
    } else {
        carrinho = carrinho.filter(p => !p.nome.includes('Mensagem'));
        document.getElementById('mensagemTexto').value = '';
    }

    salvarCarrinho(carrinho);
    abrirCarrinho();
}

// Atualiza o texto da mensagem dentro do carrinho
function atualizarMensagem() {
    const carrinho = getCarrinho();
    const itemMensagem = carrinho.find(p => p.nome.includes('Mensagem'));
    if (!itemMensagem) return;

    itemMensagem.observacao = document.getElementById('mensagemTexto').value.trim();
    salvarCarrinho(carrinho);
}

// ===============================
// Eventos
// ===============================
document.getElementById('cartBtn').addEventListener('click', abrirCarrinho);
document.getElementById('btnFechar').addEventListener('click', fecharCarrinho);
document.getElementById('btnFinalizar').addEventListener('click', finalizarPedido);
document.getElementById('chkEmbalagem').addEventListener('change', e => toggleEmbalagem(e.target.checked));
document.getElementById('chkMensagem').addEventListener('change', e => toggleMensagem(e.target.checked));
document.getElementById('mensagemTexto').addEventListener('input', atualizarMensagem);
