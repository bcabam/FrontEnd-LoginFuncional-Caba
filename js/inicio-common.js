const API_BASE = 'http://localhost:3000/api';

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

function formatearFechaVista(fechaIso) {
    if (!fechaIso) return '-';
    const partes = fechaIso.split('T')[0].split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return fechaIso;
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

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../../index.html';
    });
}

async function inicializarInicio(rolEsperado) {
    const userRaw = localStorage.getItem('user');
    const token = getToken();

    if (!userRaw || !token) {
        window.location.href = '../../index.html';
        return;
    }

    const userLocal = JSON.parse(userRaw);

    if (rolEsperado && userLocal.role !== rolEsperado) {
        window.location.href = '../../index.html';
        return;
    }

    const heroSaludo = document.getElementById('hero-saludo');
    if (heroSaludo) {
        const primerNombre = (userLocal.full_name || '').trim().split(' ')[0];
        heroSaludo.textContent = `Hola, ${capitalizar(primerNombre) || 'bienvenido'}`;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = '../../index.html';
            return;
        }

        const data = await response.json();
        const user = data.data || data.user || data;

        if (heroSaludo) {
            const primerNombre = (user.full_name || '').trim().split(' ')[0];
            heroSaludo.textContent = `Hola, ${capitalizar(primerNombre) || 'bienvenido'}`;
        }

        const resumenEmail = document.getElementById('resumen-email');
        if (resumenEmail) resumenEmail.textContent = (user.email || '').toLowerCase();

        const resumenFechaReg = document.getElementById('resumen-fecha-reg');
        if (resumenFechaReg) resumenFechaReg.textContent = formatearFechaVista(user.created_at);

        const resumenRol = document.getElementById('resumen-rol');
        if (resumenRol) {
            const nombresRol = { admin: 'Administrador', coach: 'Entrenador', user: 'Usuario' };
            resumenRol.textContent = nombresRol[user.role] || user.role;
        }

    } catch (error) {
        console.error('Error al cargar datos de inicio:', error);
    }
}