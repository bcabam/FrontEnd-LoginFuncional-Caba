const API_BASE = 'http://localhost:3000/api';

const alertaPerfil = document.getElementById('alerta-perfil');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

const resumenNombre = document.getElementById('resumen-nombre');
const resumenRol = document.getElementById('resumen-rol');
const resumenEmail = document.getElementById('resumen-email');
const resumenFechaNac = document.getElementById('resumen-fecha-nac');
const resumenFechaReg = document.getElementById('resumen-fecha-reg');

const inputNombre = document.getElementById('perfil-nombre');
const inputEmail = document.getElementById('perfil-email');
const inputFechaNac = document.getElementById('perfil-fecha-nac');
const inputDeporte = document.getElementById('perfil-deporte');
const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');

const inputPwdActual = document.getElementById('pwd-actual');
const inputPwdNueva = document.getElementById('pwd-nueva');
const inputPwdConfirm = document.getElementById('pwd-confirm');
const btnGuardarPassword = document.getElementById('btn-guardar-password');

function getToken() { return localStorage.getItem('token'); }
function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function mostrarAlerta(texto, tipo) {
    alertaPerfil.textContent = texto;
    alertaPerfil.className = `alert alert-${tipo}`;
    alertaPerfil.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => alertaPerfil.classList.add('d-none'), 4000);
}

function formatearFechaVista(fechaIso) {
    if (!fechaIso) return '-';
    const partes = fechaIso.split('T')[0].split('-');
    if(partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return fechaIso;
}

function formatearFechaInput(fechaIso) {
    if (!fechaIso) return '';
    return fechaIso.split('T')[0];
}

function getColorRol(rol) {
    if(rol === 'admin') return 'bg-danger';
    if(rol === 'coach') return 'bg-primary';
    return 'bg-success';
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

async function cargarDatosPerfil() {
    if(!getToken()) {
        window.location.href = '../../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Sesión inválida');
        
        const data = await response.json();
        const user = data.data || data.user || data;

        resumenNombre.textContent = user.full_name || 'Sin Nombre';
        resumenEmail.textContent = (user.email || '').toLowerCase();
        resumenRol.textContent = user.role;
        resumenRol.className = `badge ${getColorRol(user.role)} mb-4 mx-auto`;
        resumenFechaNac.textContent = formatearFechaVista(user.birth_date);
        resumenFechaReg.textContent = formatearFechaVista(user.created_at);

        inputNombre.value = user.full_name || '';
        inputEmail.value = user.email || '';
        inputFechaNac.value = formatearFechaInput(user.birth_date);

        if (user.role === 'admin') {
            inputEmail.removeAttribute('readonly');
            inputEmail.classList.remove('bg-light');
            const labelEmail = document.querySelector('label[for="perfil-email"]');
            if (labelEmail) labelEmail.textContent = 'Email';
        }
        
        if(user.metadata && user.metadata.sports && user.metadata.sports.length > 0) {
            inputDeporte.value = user.metadata.sports[0].name || '';
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('No se pudo cargar la información del perfil', 'danger');
    }
}

btnGuardarPerfil.addEventListener('click', async () => {
    inputNombre.classList.remove('is-invalid-field');
    document.getElementById('error-perfil-nombre').style.display = 'none';

    const nombre = inputNombre.value.trim();
    if (!nombre) {
        inputNombre.classList.add('is-invalid-field');
        document.getElementById('error-perfil-nombre').style.display = 'block';
        return;
    }

    const payload = {
        full_name: nombre,
        birth_date: inputFechaNac.value || null,
        metadata: {
            sports: inputDeporte.value ? [{ name: inputDeporte.value, frequency_per_week: 0 }] : []
        }
    };

    // Si el campo email está editable (rol admin), se incluye en la actualización
    if (!inputEmail.hasAttribute('readonly')) {
        payload.email = inputEmail.value.trim();
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarAlerta('Perfil actualizado correctamente', 'success');
            cargarDatosPerfil();
        } else {
            mostrarAlerta('Error al actualizar el perfil', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión con el servidor', 'danger');
    }
});

btnGuardarPassword.addEventListener('click', async () => {
    const inputs = [inputPwdActual, inputPwdNueva, inputPwdConfirm];
    inputs.forEach(input => {
        input.classList.remove('is-invalid-field');
        document.getElementById(`error-${input.id}`).style.display = 'none';
    });

    let valido = true;
    const actual = inputPwdActual.value;
    const nueva = inputPwdNueva.value;
    const confirmacion = inputPwdConfirm.value;

    if (!actual) {
        inputPwdActual.classList.add('is-invalid-field');
        document.getElementById('error-pwd-actual').style.display = 'block';
        valido = false;
    }
    if (nueva.length < 8) {
        inputPwdNueva.classList.add('is-invalid-field');
        document.getElementById('error-pwd-nueva').style.display = 'block';
        valido = false;
    }
    if (nueva !== confirmacion) {
        inputPwdConfirm.classList.add('is-invalid-field');
        document.getElementById('error-pwd-confirm').style.display = 'block';
        valido = false;
    }

    if (!valido) return;

    try {
        const response = await fetch(`${API_BASE}/auth/me/password`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ 
                current_password: actual,
                new_password: nueva 
            })
        });

        if (response.ok) {
            mostrarAlerta('Contraseña actualizada correctamente', 'success');
            inputs.forEach(input => input.value = '');
        } else {
            const data = await response.json();
            mostrarAlerta(data.message || 'Error al cambiar la contraseña. Verifica tu clave actual.', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión con el servidor', 'danger');
    }
});

cargarDatosPerfil();