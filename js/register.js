const registerForm = document.getElementById('register-form');
const registerMsg = document.getElementById('register-msg');


function mostrarMensaje(texto, clase) {
    registerMsg.textContent = texto;
    registerMsg.className = `text-center mt-3 small fw-bold ${clase}`;
    registerMsg.style.display = 'block';
}

function mostrarErrorCampo(idInput, mensaje) {
    const input = document.getElementById(idInput);
    const errorDiv = document.getElementById(`error-${idInput}`);

    if (input) input.classList.add('is-invalid');
    if (errorDiv) {
        if (mensaje) errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    }
}

function limpiarErrorCampo(idInput) {
    const input = document.getElementById(idInput);
    const errorDiv = document.getElementById(`error-${idInput}`);

    if (input) input.classList.remove('is-invalid');
    if (errorDiv) errorDiv.style.display = 'none';
}

function limpiarTodosLosErrores() {
    const campos = ['nombre', 'apellidos', 'fecha_nacimiento', 'correo', 'contrasena', 'confirmar_contrasena'];
    campos.forEach(limpiarErrorCampo);
    registerMsg.style.display = 'none';
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarFormulario({ nombre, correo, contrasena, confirmar_contrasena }) {
    let esValido = true;

    if (!nombre.trim()) {
        mostrarErrorCampo('nombre', 'El nombre es obligatorio.');
        esValido = false;
    }

    if (!correo.trim()) {
        mostrarErrorCampo('correo', 'El correo es obligatorio.');
        esValido = false;
    } else if (!emailValido(correo)) {
        mostrarErrorCampo('correo', 'El formato del correo no es válido.');
        esValido = false;
    }

    if (!contrasena) {
        mostrarErrorCampo('contrasena', 'La contraseña es obligatoria.');
        esValido = false;
    } else if (contrasena.length < 8) {
        mostrarErrorCampo('contrasena', 'La contraseña debe tener mínimo 8 caracteres.');
        esValido = false;
    }

    if (!confirmar_contrasena) {
        mostrarErrorCampo('confirmar_contrasena', 'Debes confirmar la contraseña.');
        esValido = false;
    } else if (contrasena && confirmar_contrasena !== contrasena) {
        mostrarErrorCampo('confirmar_contrasena', 'Las contraseñas no coinciden.');
        esValido = false;
    }

    return esValido;
}

registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    limpiarTodosLosErrores();

    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const confirmar_contrasena = document.getElementById('confirmar_contrasena').value;

    const datos = { nombre, correo, contrasena, confirmar_contrasena };

    if (!validarFormulario(datos)) {
        mostrarMensaje('Por favor corrige los errores marcados en el formulario.', 'text-danger');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: `${nombre} ${apellidos}`.trim(),
                birth_date: fecha_nacimiento,
                email: correo,
                password: contrasena
            })
        });

        const respuestaJson = await response.json();

        if (response.ok) {
            mostrarMensaje('¡Registro exitoso! Redirigiendo al login...', 'text-success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } else {
            if (respuestaJson.errors) {
                const mapaCampos = {
                    full_name: 'nombre',
                    email: 'correo',
                    password: 'contrasena',
                    birth_date: 'fecha_nacimiento'
                };

                Object.entries(respuestaJson.errors).forEach(([campoBackend, mensaje]) => {
                    const idFrontend = mapaCampos[campoBackend];
                    if (idFrontend) {
                        mostrarErrorCampo(idFrontend, mensaje);
                    }
                });
            }

            mostrarMensaje(respuestaJson.message || 'Error al registrar el usuario.', 'text-danger');
        }

    } catch (error) {
        console.error("Error de conexión:", error);
        mostrarMensaje('Error de conexión con el servidor.', 'text-danger');
    }
});