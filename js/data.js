// Simulated Database using localStorage
const DB = {
    getUsers: function() {
        return JSON.parse(localStorage.getItem('tienda_users')) || [
            { id: 'admin001', username: 'admin', password: 'adminpassword', role: 'admin' } // Default admin
        ];
    },
    saveUsers: function(users) {
        localStorage.setItem('tienda_users', JSON.stringify(users));
    },
    getProducts: function() {
        return JSON.parse(localStorage.getItem('tienda_products')) || [];
    },
    saveProducts: function(products) {
        localStorage.setItem('tienda_products', JSON.stringify(products));
    },
    getOrders: function() {
        return JSON.parse(localStorage.getItem('tienda_orders')) || [];
    },
    saveOrders: function(orders) {
        localStorage.setItem('tienda_orders', JSON.stringify(orders));
    },
    generateId: function() { // Helper for generating unique IDs
        return '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Initialize with some sample data if products are empty
if (DB.getProducts().length === 0) {
    DB.saveProducts([
        { id: DB.generateId(), name: 'Laptop Pro', description: 'Potente laptop para profesionales.', price: 1200.00, image: 'https://via.placeholder.com/100?text=Laptop' },
        { id: DB.generateId(), name: 'Smartphone X', description: 'Último modelo de smartphone.', price: 800.00, image: 'https://via.placeholder.com/100?text=Smartphone' },
        { id: DB.generateId(), name: 'Auriculares BT', description: 'Sonido inmersivo, sin cables.', price: 150.00, image: 'https://via.placeholder.com/100?text=Auriculares' }
    ]);
}