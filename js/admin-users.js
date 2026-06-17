const API_BASE = 'http://localhost:3000/api';

const tbody = document.getElementById('usuarios-tbody');
const alertaAdmin = document.getElementById('alerta-admin');

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

const modalUsuarioEl = document.getElementById('modal-usuario');
const modalUsuario = new bootstrap.Modal(modalUsuarioEl);
const modalUsuarioTitulo = document.getElementById('modal-usuario-titulo');
const formUsuario = document.getElementById('form-usuario');
const formUsuarioMsg = document.getElementById('form-usuario-msg');
const btnGuardarUsuario = document.getElementById('btn-guardar-usuario');
const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');

const usuarioIdInput = document.getElementById('usuario-id');
const usuarioNombreInput = document.getElementById('usuario-nombre');
const usuarioEmailInput = document.getElementById('usuario-email');
const usuarioRolInput = document.getElementById('usuario-rol');
const usuarioPasswordInput = document.getElementById('usuario-password');
const usuarioPasswordConfirmInput = document.getElementById('usuario-password-confirm');
const grupoPassword = document.getElementById('grupo-password');
const grupoPasswordConfirm = document.getElementById('grupo-password-confirm');

const modalEliminarEl = document.getElementById('modal-confirmar-eliminar');
const modalEliminar = new bootstrap.Modal(modalEliminarEl);
const nombreUsuarioEliminar = document.getElementById('nombre-usuario-eliminar');
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

let usuarioAEliminarId = null;
let listaUsuarios = [];

const COLORES_ROL = {
    admin: 'bg-danger',
    coach: 'bg-primary',
    user: 'bg-success'
};

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function verificarSesionAdmin() {
    const userRaw = localStorage.getItem('user');
    const token = getToken();

    if (!userRaw || !token) {
        window.location.href = '../../index.html';
        return null;
    }

    const user = JSON.parse(userRaw);

    if (user.role !== 'admin') {
        window.location.href = '../../index.html';
        return null;
    }

    return user;
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return '-';
    const fecha = new Date(fechaIso);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function mostrarAlerta(texto, tipo) {
    alertaAdmin.textContent = texto;
    alertaAdmin.className = `alert alert-${tipo}`;
    alertaAdmin.classList.remove('d-none');

    setTimeout(() => {
        alertaAdmin.classList.add('d-none');
    }, 4000);
}

if (toggleSidebarBtn && sidebar) {
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    }

document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../index.html';
});

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (response.status === 401) {
            mostrarAlerta('Tu sesión expiró. Inicia sesión nuevamente.', 'danger');
            setTimeout(() => window.location.href = '../../index.html', 1500);
            return;
        }

        const data = await response.json();
        const usuarios = data.data || data.users || data;

        listaUsuarios = Array.isArray(usuarios) ? usuarios : [];
        renderUsuarios(listaUsuarios);

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>`;
    }
}

function renderUsuarios(usuarios) {
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay usuarios registrados.</td></tr>`;
        return;
    }

    usuarios.forEach(usuario => {
        const colorBadge = COLORES_ROL[usuario.role] || 'bg-secondary';

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.full_name || '-'}</td>
            <td>${usuario.email}</td>
            <td><span class="badge ${colorBadge} badge-rol">${usuario.role}</span></td>
            <td>${formatearFecha(usuario.created_at)}</td>
            <td>
                <button class="btn btn-warning btn-sm btn-icon btn-editar" data-id="${usuario.id}" title="Editar">&#9998;</button>
                <button class="btn btn-danger btn-sm btn-icon btn-eliminar" data-id="${usuario.id}" data-nombre="${usuario.full_name || usuario.email}" title="Eliminar">&#128465;</button>
            </td>
        `;
        tbody.appendChild(fila);
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id));
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => {
            usuarioAEliminarId = btn.dataset.id;
            nombreUsuarioEliminar.textContent = btn.dataset.nombre;
            modalEliminar.show();
        });
    });
}

function limpiarErroresModal() {
    const campos = ['usuario-nombre', 'usuario-email', 'usuario-password', 'usuario-password-confirm'];
    campos.forEach(id => {
        const input = document.getElementById(id);
        const errorDiv = document.getElementById(`error-${id}`);
        if (input) input.classList.remove('is-invalid-field');
        if (errorDiv) errorDiv.style.display = 'none';
    });
    formUsuarioMsg.style.display = 'none';
}

function mostrarErrorModal(idInput, mensaje) {
    const input = document.getElementById(idInput);
    const errorDiv = document.getElementById(`error-${idInput}`);
    if (input) input.classList.add('is-invalid-field');
    if (errorDiv) {
        if (mensaje) errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    }
}

btnNuevoUsuario.addEventListener('click', () => {
    limpiarErroresModal();
    formUsuario.reset();
    usuarioIdInput.value = '';
    usuarioRolInput.value = 'user';
    modalUsuarioTitulo.textContent = 'Nuevo Usuario';

    grupoPassword.style.display = 'block';
    grupoPasswordConfirm.style.display = 'block';
    usuarioPasswordInput.setAttribute('placeholder', 'Mínimo 8 caracteres');
});

function abrirModalEditar(id) {
    const usuario = listaUsuarios.find(u => String(u.id) === String(id));
    if (!usuario) return;

    limpiarErroresModal();
    formUsuario.reset();

    usuarioIdInput.value = usuario.id;
    usuarioNombreInput.value = usuario.full_name || '';
    usuarioEmailInput.value = usuario.email || '';
    usuarioRolInput.value = usuario.role || 'user';
    modalUsuarioTitulo.textContent = 'Editar Usuario';

    // En edición, la contraseña es opcional (solo si se quiere cambiar)
    grupoPassword.style.display = 'block';
    grupoPasswordConfirm.style.display = 'block';
    usuarioPasswordInput.setAttribute('placeholder', 'Dejar en blanco para no cambiarla');

    modalUsuario.show();
}

function validarFormularioUsuario(esEdicion) {
    let valido = true;

    const nombre = usuarioNombreInput.value.trim();
    const email = usuarioEmailInput.value.trim();
    const password = usuarioPasswordInput.value;
    const passwordConfirm = usuarioPasswordConfirmInput.value;

    if (!nombre) {
        mostrarErrorModal('usuario-nombre', 'El nombre es obligatorio.');
        valido = false;
    }

    if (!email) {
        mostrarErrorModal('usuario-email', 'El email es obligatorio.');
        valido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErrorModal('usuario-email', 'El formato del email no es válido.');
        valido = false;
    }

    if (!esEdicion || password) {
        if (!esEdicion && !password) {
            mostrarErrorModal('usuario-password', 'La contraseña es obligatoria.');
            valido = false;
        } else if (password && password.length < 8) {
            mostrarErrorModal('usuario-password', 'La contraseña debe tener mínimo 8 caracteres.');
            valido = false;
        }

        if (password || !esEdicion) {
            if (!passwordConfirm) {
                mostrarErrorModal('usuario-password-confirm', 'Debes confirmar la contraseña.');
                valido = false;
            } else if (password !== passwordConfirm) {
                mostrarErrorModal('usuario-password-confirm', 'Las contraseñas no coinciden.');
                valido = false;
            }
        }
    }

    return valido;
}


btnGuardarUsuario.addEventListener('click', async () => {
    limpiarErroresModal();

    const id = usuarioIdInput.value;
    const esEdicion = Boolean(id);

    if (!validarFormularioUsuario(esEdicion)) {
        formUsuarioMsg.textContent = 'Corrige los errores marcados.';
        formUsuarioMsg.className = 'small fw-bold text-danger';
        formUsuarioMsg.style.display = 'block';
        return;
    }

    const payload = {
        full_name: usuarioNombreInput.value.trim(),
        email: usuarioEmailInput.value.trim(),
        role: usuarioRolInput.value
    };

    if (usuarioPasswordInput.value) {
        payload.password = usuarioPasswordInput.value;
    }

    const url = esEdicion ? `${API_BASE}/users/${id}` : `${API_BASE}/users`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            modalUsuario.hide();
            mostrarAlerta(esEdicion ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.', 'success');
            cargarUsuarios();
        } else {
            if (data.errors) {
                const mapa = {
                    full_name: 'usuario-nombre',
                    email: 'usuario-email',
                    password: 'usuario-password',
                    role: 'usuario-rol'
                };
                Object.entries(data.errors).forEach(([campo, mensaje]) => {
                    const idCampo = mapa[campo];
                    if (idCampo) mostrarErrorModal(idCampo, mensaje);
                });
            }
            formUsuarioMsg.textContent = data.message || 'Error al guardar el usuario.';
            formUsuarioMsg.className = 'small fw-bold text-danger';
            formUsuarioMsg.style.display = 'block';
        }

    } catch (error) {
        console.error('Error al guardar usuario:', error);
        formUsuarioMsg.textContent = 'Error de conexión con el servidor.';
        formUsuarioMsg.className = 'small fw-bold text-danger';
        formUsuarioMsg.style.display = 'block';
    }
});

btnConfirmarEliminar.addEventListener('click', async () => {
    if (!usuarioAEliminarId) return;

    try {
        const response = await fetch(`${API_BASE}/users/${usuarioAEliminarId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        if (response.ok || response.status === 204) {
            modalEliminar.hide();
            mostrarAlerta('Usuario eliminado correctamente.', 'success');
            cargarUsuarios();
        } else {
            const data = await response.json().catch(() => ({}));
            modalEliminar.hide();
            mostrarAlerta(data.message || 'No se pudo eliminar el usuario.', 'danger');
        }

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        modalEliminar.hide();
        mostrarAlerta('Error de conexión con el servidor.', 'danger');
    } finally {
        usuarioAEliminarId = null;
    }
});

const sesion = verificarSesionAdmin();
if (sesion) {
    cargarUsuarios();
}