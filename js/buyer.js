document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.protectPage(['buyer'])) return; // Proteger página de comprador

    const currentUser = Auth.getCurrentUser();
    console.log(`Comprador ${currentUser.username} ha iniciado sesión.`);

    // Elementos DOM
    const sections = {
        catalog: document.getElementById('catalog-section'),
        cart: document.getElementById('cart-section'),
        orders: document.getElementById('orders-buyer-section')
    };
    const navButtons = {
        catalog: document.getElementById('nav-catalog'),
        cart: document.getElementById('nav-cart'),
        orders: document.getElementById('nav-orders-buyer')
    };
    const logoutBtn = document.getElementById('logout-btn');

    const productCatalogDiv = document.getElementById('product-catalog');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const cartCountSpan = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartMessage = document.getElementById('cart-message');
    const cartSummaryDiv = document.getElementById('cart-summary');
    const buyerOrderListDiv = document.getElementById('buyer-order-list');

    let cart = JSON.parse(localStorage.getItem(`tienda_cart_${currentUser.id}`)) || [];

    // --- Navegación ---
    function showSection(sectionId) {
        Object.values(sections).forEach(sec => sec.style.display = 'none');
        if (sections[sectionId]) sections[sectionId].style.display = 'block';
    }

    navButtons.catalog.addEventListener('click', () => { showSection('catalog');
        loadProductCatalog(); });
    navButtons.cart.addEventListener('click', () => { showSection('cart');
        displayCart(); });
    navButtons.orders.addEventListener('click', () => { showSection('orders');
        loadBuyerOrders(); });
    logoutBtn.addEventListener('click', Auth.logout);

    // --- Catálogo de Productos ---
    function loadProductCatalog() {
        const products = DB.getProducts();
        productCatalogDiv.innerHTML = '';
        if (products.length === 0) {
            productCatalogDiv.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${p.image || 'https://via.placeholder.com/100?text=No+Img'}" alt="${p.name}">
                <h3>${p.name}</h3><p>${p.description}</p>
                <p>Precio: $${parseFloat(p.price).toFixed(2)}</p>
                <button class="add-to-cart-btn" data-id="${p.id}">Agregar al Carrito</button>`;
            productCatalogDiv.appendChild(div);
        });
        document.querySelectorAll('.add-to-cart-btn').forEach(btn =>
            btn.addEventListener('click', (e) => addToCart(e.target.dataset.id))
        );
    }

    // --- Gestión del Carrito ---
    function addToCart(productId) {
        const product = DB.getProducts().find(p => p.id === productId);
        if (!product) return;
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) cartItem.quantity++;
        else cart.push({...product, quantity: 1 });
        saveCart();
        updateCartVisuals();
        showMessage(cartMessage, `${product.name} agregado al carrito.`, 'success');
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        displayCart(); // Re-render completo del carrito
    }

    function updateQuantity(productId, quantity) {
        const numQuantity = parseInt(quantity);
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            if (numQuantity <= 0) removeFromCart(productId);
            else cartItem.quantity = numQuantity;
        }
        saveCart();
        displayCart(); // Re-render completo del carrito
    }

    function saveCart() {
        localStorage.setItem(`tienda_cart_${currentUser.id}`, JSON.stringify(cart));
    }

    function updateCartVisuals() { // Actualiza contador y total
        let total = 0;
        let itemCount = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
            itemCount += item.quantity;
        });
        cartTotalSpan.textContent = total.toFixed(2);
        cartCountSpan.textContent = itemCount;
        cartSummaryDiv.style.display = cart.length > 0 ? 'block' : 'none';
    }

    function displayCart() {
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <span>${item.name} ($${item.price.toFixed(2)} c/u)</span>
                    <div>
                        <input type="number" value="${item.quantity}" min="1" class="cart-item-quantity" data-id="${item.id}" style="width: 60px; margin-right: 5px;">
                        <span>Subtotal: $${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="remove-from-cart-btn" data-id="${item.id}" style="margin-left:10px;">Eliminar</button>
                    </div>`;
                cartItemsDiv.appendChild(div);
            });
        }
        updateCartVisuals();
        document.querySelectorAll('.remove-from-cart-btn').forEach(btn =>
            btn.addEventListener('click', (e) => removeFromCart(e.target.dataset.id))
        );
        document.querySelectorAll('.cart-item-quantity').forEach(input =>
            input.addEventListener('change', (e) => updateQuantity(e.target.dataset.id, e.target.value))
        );
    }

    // --- Checkout ---
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage(cartMessage, 'Tu carrito está vacío.', 'error');
            return;
        }
        const newOrder = {
            id: DB.generateId(),
            userId: currentUser.id,
            username: currentUser.username,
            items: [...cart],
            total: parseFloat(cartTotalSpan.textContent),
            date: new Date().toISOString(),
            status: 'pending', // Estados: pending, delivered, received, rated
            userMarkedReceived: false,
            rating: null
        };
        const orders = DB.getOrders();
        orders.push(newOrder);
        DB.saveOrders(orders);
        cart = [];
        saveCart();
        displayCart();
        showMessage(cartMessage, '¡Compra realizada con éxito!', 'success');
    });

    // --- Pedidos del Comprador ---
    function loadBuyerOrders() {
        const buyerOrders = DB.getOrders().filter(o => o.userId === currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        buyerOrderListDiv.innerHTML = '';
        if (buyerOrders.length === 0) {
            buyerOrderListDiv.innerHTML = '<p>No has realizado pedidos.</p>';
            return;
        }
        buyerOrders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-card';
            let itemsHtml = order.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('');
            let actionsHtml = '';
            if (order.status === 'delivered' && !order.userMarkedReceived) {
                actionsHtml = `<button class="mark-received-btn" data-order-id="${order.id}">Marcar como Recibido</button>`;
            } else if (order.userMarkedReceived && !order.rating) {
                actionsHtml = `<div class="rating-area">Calificar (1-5): 
                               <input type="number" class="rating-input" data-order-id="${order.id}" min="1" max="5" style="width:50px;">
                               <button class="submit-rating-btn" data-order-id="${order.id}">Enviar Calificación</button></div>`;
            } else if (order.rating) {
                actionsHtml = `<p>Tu calificación: ${order.rating}/5</p>`;
            }

            div.innerHTML = `
                <h3>Pedido ID: ${order.id}</h3>
                <p>Fecha: ${new Date(order.date).toLocaleString()}</p>
                <p>Total: $${order.total.toFixed(2)}</p>
                <p>Estado: ${order.status} ${order.userMarkedReceived ? '(Recibido por ti)' : ''}</p>
                <h4>Artículos:</h4><ul>${itemsHtml}</ul>
                <div class="order-actions">${actionsHtml}</div>`;
            buyerOrderListDiv.appendChild(div);
        });
        document.querySelectorAll('.mark-received-btn').forEach(btn => btn.addEventListener('click', (e) => markOrderAsReceived(e.target.dataset.orderId)));
        document.querySelectorAll('.submit-rating-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            const ratingInput = document.querySelector(`.rating-input[data-order-id="${orderId}"]`);
            if (ratingInput && ratingInput.value) submitRating(orderId, parseInt(ratingInput.value));
        }));
    }

    function markOrderAsReceived(orderId) {
        let orders = DB.getOrders();
        const order = orders.find(o => o.id === orderId && o.userId === currentUser.id);
        if (order) { order.userMarkedReceived = true;
            DB.saveOrders(orders);
            loadBuyerOrders(); }
    }

    function submitRating(orderId, rating) {
        if (rating < 1 || rating > 5) { alert('Calificación debe ser entre 1 y 5.'); return; }
        let orders = DB.getOrders();
        const order = orders.find(o => o.id === orderId && o.userId === currentUser.id);
        if (order && order.userMarkedReceived) { order.rating = rating;
            DB.saveOrders(orders);
            loadBuyerOrders(); } else { alert('Debes marcar como recibido primero o el pedido no se encontró.'); }
    }

    // Carga inicial
    showSection('catalog');
    loadProductCatalog();
    updateCartVisuals(); // Para el contador del header
});

function showMessage(element, message, type = 'info') { // Helper
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
    setTimeout(() => { element.textContent = '';
        element.className = 'message'; }, 3000);
}