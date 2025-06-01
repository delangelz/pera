document.addEventListener('DOMContentLoaded', () => {
    // Si ya está logueado, redirigir
    if (Auth.isLoggedIn()) {
        if (Auth.isAdmin()) {
            window.location.href = 'admin.html';
        } else { // Asumimos que el otro rol es 'buyer'
            window.location.href = 'buyer.html';
        }
    }

    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                showMessage(loginMessage, 'Por favor, ingrese usuario y contraseña.', 'error');
                return;
            }

            const user = Auth.login(username, password);

            if (user) {
                showMessage(loginMessage, 'Inicio de sesión exitoso. Redirigiendo...', 'success');
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (user.role === 'buyer') {
                    window.location.href = 'buyer.html';
                }
            } else {
                showMessage(loginMessage, 'Usuario o contraseña incorrectos.', 'error');
            }
        });
    }
});

function showMessage(element, message, type = 'info') { // Helper global
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
    setTimeout(() => { element.textContent = '';
        element.className = 'message'; }, 3000);
}