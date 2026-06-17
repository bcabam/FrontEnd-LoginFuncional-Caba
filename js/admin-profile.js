const API_BASE = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token');
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

const alertaPerfil = document.getElementById('alerta-perfil');
function mostrarAlerta(texto, tipo) {
    alertaPerfil.textContent = texto;
    alertaPerfil.className = `alert alert-${tipo} mt-3`;
    alertaPerfil.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => alertaPerfil.classList.add('d-none'), 4000);
}

async function cargarDatosPerfil() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Sesión inválida');
        
        const data = await response.json();
        const user = data.data || data.user || data;

        document.getElementById('resumen-nombre').textContent = user.full_name || 'Admin';
        document.getElementById('resumen-email').textContent = (user.email || '').toLowerCase();
        document.getElementById('resumen-fecha-reg').textContent = formatearFechaVista(user.created_at);

        document.getElementById('perfil-nombre').value = user.full_name || '';
        document.getElementById('perfil-email').value = user.email || '';
        document.getElementById('perfil-fecha-nac').value = formatearFechaInput(user.birth_date);

        localStorage.setItem('user', JSON.stringify(user));

    } catch (error) {
        console.error(error);
        mostrarAlerta('No se pudo cargar la información del perfil', 'danger');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = verificarSesionAdmin();
    if (!user) return;

    cargarDatosPerfil();

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../../index.html';
    });

    const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
    btnGuardarPerfil.addEventListener('click', async () => {
        const inputNombre = document.getElementById('perfil-nombre');
        const inputEmail = document.getElementById('perfil-email');
        const inputFechaNac = document.getElementById('perfil-fecha-nac');

        inputNombre.classList.remove('is-invalid-field');
        inputEmail.classList.remove('is-invalid-field');
        document.getElementById('error-perfil-nombre').style.display = 'none';
        document.getElementById('error-perfil-email').style.display = 'none';

        const nombre = inputNombre.value.trim();
        const email = inputEmail.value.trim();
        let valido = true;

        if (!nombre) {
            inputNombre.classList.add('is-invalid-field');
            document.getElementById('error-perfil-nombre').style.display = 'block';
            valido = false;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            inputEmail.classList.add('is-invalid-field');
            document.getElementById('error-perfil-email').style.display = 'block';
            valido = false;
        }

        if (!valido) return;

        const payload = {
            full_name: nombre,
            email: email, 
            birth_date: inputFechaNac.value || null
        };

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                mostrarAlerta('Perfil de administrador actualizado correctamente', 'success');
                cargarDatosPerfil(); // Recargar todo para ver reflejados los cambios
            } else {
                const data = await response.json().catch(() => ({}));
                mostrarAlerta(data.message || 'Error al actualizar el perfil', 'danger');
            }
        } catch (error) {
            mostrarAlerta('Error de conexión con el servidor', 'danger');
        }
    });

    const btnGuardarPassword = document.getElementById('btn-guardar-password');
    btnGuardarPassword.addEventListener('click', async () => {
        const pwdActual = document.getElementById('pwd-actual').value;
        const pwdNueva = document.getElementById('pwd-nueva').value;
        const pwdConfirm = document.getElementById('pwd-confirm').value;

        document.querySelectorAll('#form-password .error-text').forEach(el => el.style.display = 'none');
        document.querySelectorAll('#form-password .form-control').forEach(el => el.classList.remove('is-invalid-field'));

        let valido = true;

        if (!pwdActual) {
            document.getElementById('error-pwd-actual').style.display = 'block';
            document.getElementById('pwd-actual').classList.add('is-invalid-field');
            valido = false;
        }
        if (!pwdNueva || pwdNueva.length < 8) {
            document.getElementById('error-pwd-nueva').style.display = 'block';
            document.getElementById('pwd-nueva').classList.add('is-invalid-field');
            valido = false;
        }
        if (pwdNueva !== pwdConfirm) {
            document.getElementById('error-pwd-confirm').style.display = 'block';
            document.getElementById('pwd-confirm').classList.add('is-invalid-field');
            valido = false;
        }

        if (!valido) return;

        try {
            const response = await fetch(`${API_BASE}/auth/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ 
                    current_password: pwdActual,
                    new_password: pwdNueva 
                })
            });

            if (response.ok) {
                mostrarAlerta('Contraseña actualizada correctamente', 'success');
                document.getElementById('form-password').reset();
            } else {
                const data = await response.json();
                mostrarAlerta(data.message || 'Error al actualizar la contraseña. Verifica tu clave actual.', 'danger');
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta('Error de conexión con el servidor', 'danger');
        }
    });
});