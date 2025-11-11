// ======== Funções da API ========

async function get_produtos() {
    try {
        const res = await fetch(`${API_BASE}/produtos`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });
        return await res.json();
    } catch (e) {
        console.error('Erro ao buscar produtos', e);
        return [];
    }
}

async function update_produto(id, data) {
    try {
        const res = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.error('Erro ao atualizar produto', e);
        return null;
    }
}

async function delete_produto(id) {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    try {
        const res = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const j = await res.json();
        alert(j.message || 'Produto removido');
        await renderProdutos();
    } catch (e) {
        alert('Erro ao remover produto');
        console.error(e);
    }
}

// ======== Renderização ========

async function renderProdutos() {
    let produtos = await get_produtos();
    const tbody = document.querySelector('tbody');
    if (!tbody) return
    tbody.innerHTML = '';

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>
            <button onclick="editProduto(${p.id})">✏️</button>
            <button onclick="delete_produto(${p.id})">🗑️</button>
        </td>
        <td>${p.nome}</td>
        <td>R$ ${Number(p.preco).toFixed(2)}</td>
        <td>${p.estoque}</td>
        <td>${p.ativo ? 'Sim' : 'Não'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ======== Edição ========

async function editProduto(id) {
    try {
        const res = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'GET',
            credentials: 'include'
        });
        const p = await res.json();

        document.getElementById('id').value = p.id;
        document.getElementById('nome').value = p.nome;
        document.getElementById('descricao').value = p.descricao || '';
        document.getElementById('preco').value = p.preco;
        document.getElementById('estoque').value = p.estoque;
        document.getElementById('ativo').value = p.ativo ? '1' : '0';
        document.getElementById('imagem').value = p.imagem;
        document.getElementById('btnSalvar').textContent = 'Atualizar';

        const previewWrapper = document.getElementById('preview-wrapper');
        const previewImg = document.getElementById('preview-img');
        if (p.imagem) {
            previewImg.src = p.imagem;
            previewWrapper.classList.remove('hidden');
        } else {
            previewImg.src = '';
            previewWrapper.classList.add('hidden');
        }
    } catch (e) {
        console.error('Erro ao buscar produto', e);
    }
}

// ======== Envio do formulário ========

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('id').value.trim();
    const nome = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const preco = parseFloat(document.getElementById('preco').value);
    const estoque = parseInt(document.getElementById('estoque').value);
    const imagem = document.getElementById('imagem').value.trim();
    const ativo = document.getElementById('ativo').value === '1';

    if (!nome || isNaN(preco)) {
        alert('Preencha nome e preço corretamente');
        return;
    }

    const payload = { nome, descricao, preco, estoque, ativo, imagem };

    try {
        if (id) {
            const res = await update_produto(id, payload);
            alert(res.message || 'Produto atualizado com sucesso');
        } else {
            const res = await fetch(`${API_BASE}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const j = await res.json();
            alert(j.message || 'Produto criado');
        }


        document.getElementById('produtoForm')?.reset();
        document.getElementById('id').value = '';
        document.getElementById('btnSalvar').textContent = 'Salvar';
        await renderProdutos();
    } catch (e) {
        alert('Erro ao salvar produto');
        console.error(e);
    }
}

function renderProdutosIndex(produtos) {
    const section = document.getElementById('Produtos');
    section.innerHTML = ''; // limpa antes de preencher

    if (!produtos.length) {
        section.innerHTML = `<p style="color:white; text-align:center;">Nenhum produto disponível.</p>`;
        return;
    }
    embalagem = produtos.find(e => e.nome.includes("Embalagem"))
    window.embalagem = embalagem
    window.produtoMensagem = produtos.find(e => e.nome.includes("Mensagem"))


    produtos = produtos.filter(e => !e.nome.includes("Embalagem"))
    produtos = produtos.filter(e => !e.nome.includes("Mensagem"))
    produtos = produtos.filter(e => e.estoque > 0)
    produtos = produtos.filter(e => e.ativo)

        .filter(p => p.ativo) // só produtos ativos
        .forEach(p => {
            const card = document.createElement('div');
            card.style.cssText = `
                    width: 160px;
                    border-radius: 4px;
                    background-color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 1rem 0.5rem;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                `;
            card.innerHTML = `
                    <div style="font-size: 13px; text-align: center; font-weight: 700;">
                        ${p.nome}
                    </div>
                    <img style="width: 80%; border-radius: 4px;"
                         src="${p.imagem || 'https://via.placeholder.com/150?text=Sem+Imagem'}"
                         alt="${p.nome}">
                    <div style="font-size: 13px; text-align: center; font-weight: 700;margin-top:auto">
                        R$ ${Number(p.preco).toFixed(2)}
                    </div>
                    <button style="
                        font-size: 12px;
                        font-weight: 700;
                        border: none;
                        background-color: #3b2f2f;
                        color: white;
                        padding: 6px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">
                        Comprar
                    </button>
                `;
            card.querySelector('button').addEventListener('click', () => {
                adicionarAoCarrinho(p, embalagem);
            });
            card.addEventListener('mouseover', () => (card.style.transform = 'scale(1.05)'));
            card.addEventListener('mouseout', () => (card.style.transform = 'scale(1)'));
            section.appendChild(card);
        });
}
// ======== Inicialização ========

document.addEventListener('DOMContentLoaded', async () => {
    await renderProdutos();
    document.getElementById('produtoForm')?.addEventListener('submit', handleFormSubmit);
});

