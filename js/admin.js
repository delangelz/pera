document.addEventListener('DOMContentLoaded', () => {
            if (!Auth.protectPage(['admin'])) return; // Proteger página de administrador

            const currentUser = Auth.getCurrentUser();
            console.log(`Admin ${currentUser.username} ha iniciado sesión.`);

            // Elementos DOM
            const sections = {
                products: document.getElementById('products-section'),
                users: document.getElementById('users-section'),
                orders: document.getElementById('orders-section')
            };
            const navButtons = {
                products: document.getElementById('nav-products'),
                users: document.getElementById('nav-users'),
                orders: document.getElementById('nav-orders')
            };
            const logoutBtn = document.getElementById('logout-btn');

            // Formulario de productos
            const addProductBtn = document.getElementById('add-product-btn');
            const productNameInput = document.getElementById('product-name');
            const productDescriptionInput = document.getElementById('product-description');
            const productPriceInput = document.getElementById('product-price');
            const productImageInput = document.getElementById('product-image');
            const productListAdminDiv = document.getElementById('product-list-admin');
            const productMessage = document.getElementById('product-message');

            // Formulario de usuarios
            const addUserBtn = document.getElementById('add-user-btn');
            const newUsernameInput = document.getElementById('new-username');
            const newPasswordInput = document.getElementById('new-password');
            const userListAdminDiv = document.getElementById('user-list-admin');
            const userMessage = document.getElementById('user-message');

            // Lista de pedidos
            const orderListAdminDiv = document.getElementById('order-list-admin');

            // --- Navegación ---
            function showSection(sectionId) {
                Object.values(sections).forEach(sec => sec.style.display = 'none');
                if (sections[sectionId]) sections[sectionId].style.display = 'block';
            }

            navButtons.products.addEventListener('click', () => { showSection('products');
                loadProductsAdmin(); });
            navButtons.users.addEventListener('click', () => { showSection('users');
                loadUsersAdmin(); });
            navButtons.orders.addEventListener('click', () => { showSection('orders');
                loadOrdersAdmin(); });
            logoutBtn.addEventListener('click', Auth.logout);

            // --- Gestión de Productos ---
            function loadProductsAdmin() {
                const products = DB.getProducts();
                productListAdminDiv.innerHTML = '';
                if (products.length === 0) {
                    productListAdminDiv.innerHTML = '<p>No hay productos cargados.</p>';
                    return;
                }
                products.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'product-card';
                    div.innerHTML = `
                <img src="${p.image || 'https://via.placeholder.com/50?text=No+Img'}" alt="${p.name}">
                <div>
                    <h3>${p.name}</h3><p>${p.description}</p>
                    <p>Precio: $${parseFloat(p.price).toFixed(2)}</p>
                    <p><small>ID: ${p.id}</small></p>
                    <button class="delete-product-btn" data-id="${p.id}">Eliminar</button>
                </div>`;
                    productListAdminDiv.appendChild(div);
                });
                document.querySelectorAll('.delete-product-btn').forEach(btn =>
                    btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id))
                );
            }

            function deleteProduct(productId) {
                if (!confirm('¿Seguro que desea eliminar este producto?')) return;
                let products = DB.getProducts().filter(p => p.id !== productId);
                DB.saveProducts(products);
                loadProductsAdmin();
                showMessage(productMessage, 'Producto eliminado.', 'success');
            }

            addProductBtn.addEventListener('click', () => {
                const name = productNameInput.value.trim();
                const price = parseFloat(productPriceInput.value);
                if (!name || !price || price <= 0) {
                    showMessage(productMessage, 'Nombre y precio válido son obligatorios.', 'error');
                    return;
                }
                const newProduct = {
                    id: DB.generateId(),
                    name,
                    description: productDescriptionInput.value.trim(),
                    price,
                    image: productImageInput.value.trim()
                };
                const products = DB.getProducts();
                products.push(newProduct);
                DB.saveProducts(products);
                showMessage(productMessage, 'Producto agregado.', 'success');
                [productNameInput, productDescriptionInput, productPriceInput, productImageInput].forEach(i => i.value = '');
                loadProductsAdmin();
            });

            // --- Gestión de Usuarios ---
            function loadUsersAdmin() {
                userListAdminDiv.innerHTML = '';
                DB.getUsers().filter(u => u.role === 'buyer').forEach(user => {
                    const div = document.createElement('div');
                    div.className = 'user-card';
                    div.innerHTML = `<h3>${user.username} (Comprador)</h3><p>ID: ${user.id}</p>`;
                    userListAdminDiv.appendChild(div);
                });
            }

            addUserBtn.addEventListener('click', () => {
                const username = newUsernameInput.value.trim();
                const password = newPasswordInput.value.trim();
                if (!username || !password) {
                    showMessage(userMessage, 'Usuario y contraseña son obligatorios.', 'error');
                    return;
                }
                let users = DB.getUsers();
                if (users.find(u => u.username === username)) {
                    showMessage(userMessage, 'Ese nombre de usuario ya existe.', 'error');
                    return;
                }
                users.push({ id: DB.generateId(), username, password, role: 'buyer' });
                DB.saveUsers(users);
                showMessage(userMessage, 'Usuario comprador creado.', 'success');
                [newUsernameInput, newPasswordInput].forEach(i => i.value = '');
                loadUsersAdmin();
            });

            // --- Gestión de Pedidos ---
            function loadOrdersAdmin() {
                orderListAdminDiv.innerHTML = '';
                const orders = DB.getOrders().sort((a, b) => new Date(b.date) - new Date(a.date));
                if (orders.length === 0) {
                    orderListAdminDiv.innerHTML = '<p>No hay pedidos registrados.</p>';
                    return;
                }
                orders.forEach(order => {
                            const div = document.createElement('div');
                            div.className = 'order-card';
                            let itemsHtml = order.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('');
                            div.innerHTML = `
                <h3>Pedido ID: ${order.id} (Usuario: ${order.username})</h3>
                <p>Fecha: ${new Date(order.date).toLocaleString()}</p>
                <p>Total: $${order.total.toFixed(2)}</p>
                <p>Estado: 
                    <select class="order-status-select" data-order-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Procesando</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </p>
                <h4>Artículos:</h4><ul>${itemsHtml}</ul>
                ${order.userMarkedReceived ? '<p><em>Confirmado como recibido por el comprador.</em></p>' : ''}
                ${order.rating ? `<p><em>Calificación del comprador: ${order.rating}/5</em></p>` : ''}`;
            orderListAdminDiv.appendChild(div);
        });
        document.querySelectorAll('.order-status-select').forEach(sel => 
            sel.addEventListener('change', (e) => updateOrderStatus(e.target.dataset.orderId, e.target.value))
        );
    }

    function updateOrderStatus(orderId, newStatus) {
        let orders = DB.getOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            DB.saveOrders(orders);
            // No es necesario recargar toda la lista, pero podría ser útil si el orden cambia.
            // loadOrdersAdmin(); 
            console.log(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
        }
    }

    // Carga inicial
    showSection('products');
    loadProductsAdmin();
});

// Mover showMessage a un archivo utils.js si se usa en múltiples sitios, o duplicar si es más simple por ahora.
function showMessage(element, message, type = 'info') {
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
    setTimeout(() => { element.textContent = ''; element.className = 'message'; }, 3000);
}