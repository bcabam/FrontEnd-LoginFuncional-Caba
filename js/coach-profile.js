const API_BASE = 'http://localhost:3000/api';

const alertaCoach = document.getElementById('alerta-coach');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

const resumenNombre = document.getElementById('coach-resumen-nombre');
const resumenEmail = document.getElementById('coach-resumen-email');
const resumenFechaNac = document.getElementById('coach-resumen-fecha-nac');
const resumenFechaReg = document.getElementById('coach-resumen-fecha-reg');

const inputNombre = document.getElementById('coach-input-nombre');
const inputEmail = document.getElementById('coach-input-email');
const inputFechaNac = document.getElementById('coach-input-fecha-nac');
const btnGuardarCoach = document.getElementById('btn-guardar-coach');

const inputPwdActual = document.getElementById('pwd-actual');
const inputPwdNueva = document.getElementById('pwd-nueva');
const inputPwdConfirm = document.getElementById('pwd-confirm');
const btnPasswordCoach = document.getElementById('btn-password-coach');

function getToken() { return localStorage.getItem('token'); }
function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function verificarSesionCoach() {
    const userRaw = localStorage.getItem('user');
    const token = getToken();

    if (!userRaw || !token) {
        window.location.href = '../../index.html';
        return null;
    }

    const user = JSON.parse(userRaw);
    if (user.role !== 'coach') {
        window.location.href = '../../index.html';
        return null;
    }
    return user;
}

function formatearFechaVista(fechaIso) {
    if (!fechaIso) return '-';
    const partes = fechaIso.split('T')[0].split('-');
    if(partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`; // Formato dd/mm/yyyy requerido
    return fechaIso;
}

function formatearFechaInput(fechaIso) {
    if (!fechaIso) return '';
    return fechaIso.split('T')[0];
}

function mostrarAlerta(texto, tipo) {
    alertaCoach.textContent = texto;
    alertaCoach.className = `alert alert-${tipo}`;
    alertaCoach.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => alertaCoach.classList.add('d-none'), 4000);
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

async function cargarPerfilCoach() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Expirado');

        const data = await response.json();
        const coach = data.data || data.user || data;

        resumenNombre.textContent = coach.full_name || 'Coach';
        resumenEmail.textContent = (coach.email || '').toLowerCase();
        resumenFechaNac.textContent = formatearFechaVista(coach.birth_date);
        resumenFechaReg.textContent = formatearFechaVista(coach.created_at);

        inputNombre.value = coach.full_name || '';
        inputEmail.value = coach.email || '';
        inputFechaNac.value = formatearFechaInput(coach.birth_date);

    } catch (error) {
        console.error(error);
        mostrarAlerta('Error al enlazar los datos con el servidor.', 'danger');
    }
}

btnGuardarCoach.addEventListener('click', async () => {
    inputNombre.classList.remove('is-invalid-field');
    document.getElementById('error-coach-nombre').style.display = 'none';

    const nombre = inputNombre.value.trim();
    if (!nombre) {
        inputNombre.classList.add('is-invalid-field');
        document.getElementById('error-coach-nombre').style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                full_name: nombre,
                birth_date: inputFechaNac.value || null
            })
        });

        if (response.ok) {
            mostrarAlerta('Perfil actualizado correctamente.', 'success');
            cargarPerfilCoach();
        } else {
            mostrarAlerta('No se pudo procesar la actualización.', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Fallo de conexión con el backend.', 'danger');
    }
});

btnPasswordCoach.addEventListener('click', async () => {
    const campos = [inputPwdActual, inputPwdNueva, inputPwdConfirm];
    campos.forEach(c => {
        c.classList.remove('is-invalid-field');
        document.getElementById(`error-${c.id}`).style.display = 'none';
    });

    let tokenValido = true;
    if (!inputPwdActual.value) {
        inputPwdActual.classList.add('is-invalid-field');
        document.getElementById('error-pwd-actual').style.display = 'block';
        tokenValido = false;
    }
    if (inputPwdNueva.value.length < 8) {
        inputPwdNueva.classList.add('is-invalid-field');
        document.getElementById('error-pwd-nueva').style.display = 'block';
        tokenValido = false;
    }
    if (inputPwdNueva.value !== inputPwdConfirm.value) {
        inputPwdConfirm.classList.add('is-invalid-field');
        document.getElementById('error-pwd-confirm').style.display = 'block';
        tokenValido = false;
    }

    if (!tokenValido) return;

    try {
        const response = await fetch(`${API_BASE}/auth/me/password`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                current_password: inputPwdActual.value,
                new_password: inputPwdNueva.value
            })
        });

        if (response.ok) {
            mostrarAlerta('Contraseña modificada de forma segura.', 'success');
            campos.forEach(c => c.value = '');
        } else {
            const errData = await response.json().catch(() => ({}));
            mostrarAlerta(errData.message || 'La clave actual ingresada no coincide.', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Error al intentar comunicar con el servidor.', 'danger');
    }
});

const sesionValida = verificarSesionCoach();
if (sesionValida) {
    cargarPerfilCoach();
}