async function getPedidos() {
    try {
        const res = await fetch(`${API_BASE}/pedidos`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erro ao buscar pedidos');
        return await res.json();
    } catch (e) {
        console.error('Erro ao buscar pedidos:', e);
        return [];
    }
}

async function deletePedido(id) {
    if (!confirm('Deseja realmente remover este pedido?')) return;
    try {
        const res = await fetch(`${API_BASE}/pedidos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        alert(data.message || 'Pedido removido.');
        await renderPedidos();
    } catch (e) {
        console.error(e);
        alert('Erro ao remover pedido.');
    }
}

async function updateStatus(id) {
    const novoStatus = prompt('Novo status (CRIADO, PAGO, ENVIADO, CANCELADO, CONCLUIDO):');
    if (!novoStatus) return;
    try {
        const res = await fetch(`${API_BASE}/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: novoStatus })
        });
        const data = await res.json();
        alert(data.message || 'Pedido atualizado.');
        await renderPedidos();
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar pedido.');
    }
}

async function setFeedback(pedidoId, stars) {
    try {
        const res = await fetch(`${API_BASE}/pedidos/${pedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ feedback: stars })
        });
        const data = await res.json();
        alert(data.message || `Feedback ${stars} estrelas enviado!`);
        await renderPedidos();
    } catch (e) {
        console.error('Erro ao enviar feedback:', e);
        alert('Erro ao enviar feedback.');
    }
}

async function renderPedidos() {
    const pedidos = await getPedidos();
    const tbody = document.querySelector('#pedidosTable tbody');
    tbody.innerHTML = '';

    if (!pedidos.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    pedidos.forEach(p => {
        const tr = document.createElement('tr');
        // Se o pedido estiver concluído, mostra estrelas
        let feedbackHtml = '';
        if (p.status === 'CONCLUIDO') {
            const current = p.feedback || 0;
            feedbackHtml = `<div class="stars">` +
                [1, 2, 3, 4, 5].map(i =>
                    `<span class="star ${i <= current ? 'filled' : ''}" onclick="setFeedback(${p.id}, ${i})">★</span>`
                ).join('') +
                `</div>`;
        } else {
            feedbackHtml = '-';
        }

        tr.innerHTML = `
      <td>${p.id}</td>
      <td class="status">${p.status}</td>
      <td>${new Date(p.created_at).toLocaleString()}</td>
      <td>${p.total_final?.toFixed(2) || '0.00'}</td>
      <td><button onclick="verDetalhes(${p.id})">👁️ Ver Itens</button></td>
      <td>${feedbackHtml}</td>
      <td class="admin-only">
        <button class="edit" onclick="updateStatus(${p.id})">✏️</button>
        <button class="delete" onclick="deletePedido(${p.id})">🗑️</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

async function verDetalhes(id) {
    try {
        const res = await fetch(`${API_BASE}/pedidos/${id}`, {
            method: 'GET',
            credentials: 'include'
        });
        const p = await res.json();
        if (!p.itens?.length) return alert('Sem itens neste pedido.');

        let msg = `Pedido #${p.id}\nStatus: ${p.status}\n\nItens:\n`;
        p.itens.forEach(i => {
            msg += `- ${i.nome} (${i.quantidade}x) - R$ ${i.preco_unitario}\n`;
        });
        alert(msg);
    } catch (e) {
        console.error('Erro ao buscar pedido:', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const admin = await isAdmin(); // função do auth.js
    if (admin) {
        document.body.classList.add('admin');
    }
    await renderPedidos();
});
