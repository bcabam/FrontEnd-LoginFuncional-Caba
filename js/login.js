const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

console.log("1. El archivo login.js se ha cargado en el HTML."); 

loginForm.addEventListener('submit', async function(event) {
    // ¡ESTA LÍNEA ES LA QUE FRENA LA RECARGA DE LA PÁGINA!
    event.preventDefault(); 
    console.log("2. Botón presionado. Proceso iniciado.");

    const correoIngresado = document.getElementById('correo').value;
    const contrasenaIngresada = document.getElementById('contrasena').value;
    
    console.log("3. Datos capturados:", correoIngresado);

    try {
        console.log("4. Enviando datos al backend...");
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: correoIngresado, 
                password: contrasenaIngresada 
            })
        });

        console.log("5. Respuesta recibida. Status HTTP:", response.status);
        
        const data = await response.json();
        console.log("6. Datos leídos de la API:", data);

        if (response.ok) {
            console.log("7. ¡Credenciales correctas!");
            errorMsg.style.display = 'none';

            // Cubrimos ambas estructuras que arroja tu backend
            const usuarioLogueado = data.data ? data.data.user : data.user;
            const token = data.data ? data.data.token : data.token;
            
            console.log("8. Usuario listo para guardar:", usuarioLogueado);

            // Guardamos la sesión
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(usuarioLogueado));

            console.log("9. Iniciando redirección...");
            
            // Redirección al dashboard según el rol
            if (usuarioLogueado.role === 'admin') {
                window.location.href = 'pages/admin/inicio.html';
            } else if (usuarioLogueado.role === 'coach') {
                window.location.href = 'pages/coach/inicio.html';
            } else if (usuarioLogueado.role === 'user') {
                window.location.href = 'pages/user/inicio.html';
            }
        } else {
            console.warn("7. Credenciales rechazadas por el backend.");
            // Mostramos el error real que envíe tu backend (ej. "Contraseña incorrecta")
            errorMsg.textContent = data.message || "Credenciales incorrectas";
            errorMsg.style.display = 'block';
        }
        
    } catch (error) {
        console.error("ERROR CRÍTICO:", error);
        errorMsg.textContent = "Error de conexión con el servidor.";
        errorMsg.style.display = 'block';
    }
});