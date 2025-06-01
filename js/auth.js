const Auth = {
    currentUser: null,

    login: function(username, password) {
        const users = DB.getUsers();
        // ATENCIÓN: Comparación de contraseñas en texto plano. ¡NO SEGURO PARA PRODUCCIÓN!
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('tienda_currentUser', JSON.stringify(user)); // Usar sessionStorage para la sesión actual
            return user;
        }
        return null;
    },

    logout: function() {
        this.currentUser = null;
        sessionStorage.removeItem('tienda_currentUser');
        window.location.href = 'index.html'; // Redirigir a la página de login
    },

    getCurrentUser: function() {
        if (this.currentUser) {
            return this.currentUser;
        }
        const userStr = sessionStorage.getItem('tienda_currentUser');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            return this.currentUser;
        }
        return null;
    },

    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },

    isAdmin: function() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    // Protege una página, redirigiendo si no se cumple el rol o no está logueado
    protectPage: function(allowedRoles = []) {
        if (!this.isLoggedIn()) { window.location.href = 'index.html'; return false; }
        const user = this.getCurrentUser();
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert('Acceso no autorizado.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};