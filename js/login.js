const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const correoIngresado = document.getElementById('correo').value;
    const contrasenaIngresada = document.getElementById('contrasena').value;

    const usuarioEncontrado = users.find(
        user => user.user === correoIngresado && user.password === contrasenaIngresada
    );

    if (usuarioEncontrado) {
        errorMsg.style.display = 'none';

        localStorage.setItem("user", JSON.stringify(usuarioEncontrado));

        if (usuarioEncontrado.role === 'admin') {
            window.location.href = 'pages/admin/dashboard.html';
        } else if (usuarioEncontrado.role === 'coach') {
            window.location.href = 'pages/coach/dashboard.html';
        } else if (usuarioEncontrado.role === 'user') {
            window.location.href = 'pages/user/dashboard.html';
        }
    } else {
        errorMsg.style.display = 'block';
    }
});