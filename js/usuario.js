//usuario.js

// Busca todos os usuários
async function get_usuarios() {
    try {
        const res = await fetch(`${API_BASE}/usuarios`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });
        return await res.json();
    } catch (e) {
        console.error('Erro ao buscar usuários', e);
        return [];
    }
}

// Atualiza usuário existente
async function update_usuario(id, data) {
    try {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.error('Erro ao atualizar usuário', e);
        return null;
    }
}

// Remove usuário
async function delete_usuario(id) {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const j = await res.json();
        alert(j.message || 'Usuário removido');
        await renderUsuarios(); // recarrega tabela
    } catch (e) {
        alert('Erro ao remover usuário');
        console.error(e);
    }
}

// Renderiza tabela de usuários
async function renderUsuarios() {
    const admin = await isAdmin()
    if (!admin) {
        return
    }
    document.getElementById('adminLink').style.display = 'block';
    document.getElementById('lista_produto').style.display = 'flex';
    document.getElementById('roleRow').style.display = 'flex';


    const usuarios = await get_usuarios();
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = ''; // limpa tabela

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>
        <button onclick="editUsuario('${u.id}')">✏️</button>
        <button onclick="delete_usuario('${u.id}')">🗑️</button>
      </td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
    `;
        tbody.appendChild(tr);
    });
}

// Preenche formulário para edição
async function editUsuario(id) {
    try {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: 'GET',
            credentials: 'include'
        });
        const u = await res.json();

        document.getElementById('id').value = u.id;
        document.getElementById('nome').value = u.nome;
        document.getElementById('email').value = u.email;
        document.getElementById('senha').value = '';
        document.getElementById('confirmSenha').value = '';
        const roleSel = document.getElementById('role');
        if (roleSel && u.role) roleSel.value = u.role;

        // muda texto do botão para indicar modo edição
        document.getElementById('btnSalvar').textContent = 'Atualizar';
    } catch (e) {
        console.error('Erro ao buscar usuário', e);
    }
}

// Handler de submit com detecção de edição
async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('id').value.trim();
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmSenha = document.getElementById('confirmSenha').value;
    const roleSel = document.getElementById('role');
    const role = roleSel ? roleSel.value : undefined;

    if (!nome || !email) {
        alert('Preencha nome e email');
        return;
    }
    if (senha && senha !== confirmSenha) {
        alert('As senhas não conferem');
        return;
    }

    const payload = { nome, email };
    if (senha) payload.senha = senha;
    if (role) payload.role = role;

    try {
        if (id) {
            // modo edição
            const res = await update_usuario(id, payload);
            alert(res.message || 'Usuário atualizado com sucesso');
        } else {
            // modo criação
            const res = await fetch(`${API_BASE}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const j = await res.json();
            alert(j.message || 'Usuário criado');
        }
        document.getElementById('userForm').reset();
        document.getElementById('id').value = '';
        document.getElementById('btnSalvar').textContent = 'Salvar';
        await renderUsuarios();
    } catch (e) {
        alert('Erro ao salvar usuário');
        console.error(e);
    }
}

// inicialização automática ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    await renderUsuarios();
    document.getElementById('userForm').addEventListener('submit', handleFormSubmit);
});
