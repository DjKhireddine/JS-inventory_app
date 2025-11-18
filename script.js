// Application d'inventaire personnel - Logique JavaScript
class InventoryApp {
    constructor() {
        this.categories = this.loadFromStorage('categories') || [];
        this.items = this.loadFromStorage('items') || [];
        this.currentView = 'inventory';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingCategory = null;
        this.editingItem = null;
        
        this.init();
    }

    // Initialisation de l'application
    init() {
        this.bindEvents();
        this.renderCategories();
        this.renderItems();
        this.updateCategorySelects();
        this.updateFilterChips();
    }

    // Liaison des événements
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Recherche
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderItems();
            clearSearch.classList.toggle('visible', this.searchQuery.length > 0);
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            this.renderItems();
            clearSearch.classList.remove('visible');
        });

        // Formulaire d'ajout d'objet
        document.getElementById('add-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        // Boutons d'ajout de catégorie
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        // Modales
        this.bindModalEvents();

        // Sélecteur de couleur
        document.getElementById('category-color').addEventListener('change', (e) => {
            document.querySelector('.color-preview').style.backgroundColor = e.target.value;
        });
    }

    // Événements des modales
    bindModalEvents() {
        // Modale de catégorie
        const categoryModal = document.getElementById('category-modal');
        const categoryForm = document.getElementById('category-form');
        
        document.getElementById('category-modal-close').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        document.getElementById('category-cancel').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategoryModal();
        });

        // Modale d'objet
        const itemModal = document.getElementById('item-modal');
        const itemForm = document.getElementById('item-edit-form');
        
        document.getElementById('item-modal-close').addEventListener('click', () => {
            this.closeItemModal();
        });
        
        document.getElementById('item-cancel').addEventListener('click', () => {
            this.closeItemModal();
        });
        
        document.getElementById('item-delete').addEventListener('click', () => {
            this.deleteItem();
        });
        
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItemModal();
        });

        // Fermeture par clic sur l'overlay
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                this.closeCategoryModal();
            }
        });

        itemModal.addEventListener('click', (e) => {
            if (e.target === itemModal) {
                this.closeItemModal();
            }
        });

        // Toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast();
        });
    }

    // Changement de vue
    switchView(view) {
        console.log(view);
        this.currentView = view;
        
        // Mise à jour de la navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Mise à jour des vues
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.toggle('active', viewEl.id === `${view}-view`);
        });
    }

    // Gestion des catégories
    addCategory(name, color, icon) {
        const category = {
            id: Date.now().toString(),
            name,
            color,
            icon,
            createdAt: new Date().toISOString()
        };
        
        this.categories.push(category);
        this.saveToStorage('categories', this.categories);
        this.renderCategories();
        this.updateCategorySelects();
        this.updateFilterChips();
        this.showToast(`Catégorie "${name}" ajoutée avec succès`, 'success');
        
        return category;
    }

    editCategory(id, name, color, icon) {
        const categoryIndex = this.categories.findIndex(cat => cat.id === id);
        if (categoryIndex !== -1) {
            this.categories[categoryIndex] = {
                ...this.categories[categoryIndex],
                name,
                color,
                icon
            };
            
            this.saveToStorage('categories', this.categories);
            this.renderCategories();
            this.updateCategorySelects();
            this.updateFilterChips();
            this.renderItems();
            this.showToast(`Catégorie "${name}" modifiée avec succès`, 'success');
        }
    }

    deleteCategory(id) {
        const category = this.categories.find(cat => cat.id === id);
        if (!category) return;

        // Vérifier s'il y a des objets dans cette catégorie
        const itemsInCategory = this.items.filter(item => item.categoryId === id);
        if (itemsInCategory.length > 0) {
            this.showToast(`Impossible de supprimer la catégorie "${category.name}" : elle contient ${itemsInCategory.length} objet(s)`, 'warning');
            return;
        }

        this.categories = this.categories.filter(cat => cat.id !== id);
        this.saveToStorage('categories', this.categories);
        this.renderCategories();
        this.updateCategorySelects();
        this.updateFilterChips();
        this.showToast(`Catégorie "${category.name}" supprimée avec succès`, 'success');
    }

    // Gestion des objets
    addItem() {
        const form = document.getElementById('add-item-form');
        const formData = new FormData(form);
        
        const name = document.getElementById('item-name').value.trim();
        const description = document.getElementById('item-description').value.trim();
        const categoryId = document.getElementById('item-category').value;
        const location = document.getElementById('item-location').value.trim();
        const quantity = parseInt(document.getElementById('item-quantity').value) || 1;

        if (!name || !categoryId) {
            this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }

        const item = {
            id: Date.now().toString(),
            name,
            description,
            categoryId,
            location,
            quantity,
            createdAt: new Date().toISOString()
        };

        this.items.push(item);
        this.saveToStorage('items', this.items);
        this.renderItems();
        form.reset();
        document.getElementById('item-quantity').value = 1;
        
        const category = this.categories.find(cat => cat.id === categoryId);
        this.showToast(`Objet "${name}" ajouté dans "${category?.name || 'Catégorie inconnue'}"`, 'success');
    }

    editItem(id, name, description, categoryId, location, quantity) {
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            this.items[itemIndex] = {
                ...this.items[itemIndex],
                name,
                description,
                categoryId,
                location,
                quantity
            };
            
            this.saveToStorage('items', this.items);
            this.renderItems();
            this.showToast(`Objet "${name}" modifié avec succès`, 'success');
        }
    }

    deleteItem() {
        if (!this.editingItem) return;

        const item = this.items.find(item => item.id === this.editingItem);
        if (!item) return;

        this.items = this.items.filter(item => item.id !== this.editingItem);
        this.saveToStorage('items', this.items);
        this.renderItems();
        this.closeItemModal();
        this.showToast(`Objet "${item.name}" supprimé avec succès`, 'success');
    }

    // Rendu des catégories
    renderCategories() {
        const container = document.getElementById('categories-list');
        
        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">category</span>
                    <p>Aucune catégorie créée</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-icon" style="background-color: ${category.color}">
                        <span class="material-symbols-outlined">${category.icon}</span>
                    </div>
                    <span class="category-name">${this.escapeHtml(category.name)}</span>
                </div>
                <div class="category-actions">
                    <button class="item-action" onclick="app.openCategoryModal('${category.id}')" title="Modifier">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="item-action" onclick="app.deleteCategory('${category.id}')" title="Supprimer">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Rendu des objets
    renderItems() {
        const container = document.getElementById('items-container');
        let filteredItems = this.items;

        // Filtrage par catégorie
        if (this.currentFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.categoryId === this.currentFilter);
        }

        // Filtrage par recherche
        if (this.searchQuery) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(this.searchQuery) ||
                item.description.toLowerCase().includes(this.searchQuery) ||
                item.location.toLowerCase().includes(this.searchQuery)
            );
        }

        // Mise à jour du compteur
        const countElement = document.querySelector('.item-count');
        countElement.textContent = `${filteredItems.length} objet${filteredItems.length !== 1 ? 's' : ''}`;

        if (filteredItems.length === 0) {
            const emptyMessage = this.searchQuery 
                ? `Aucun objet trouvé pour "${this.searchQuery}"`
                : this.currentFilter !== 'all'
                    ? 'Aucun objet dans cette catégorie'
                    : 'Aucun objet trouvé';
                    
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">inventory</span>
                    <h3>${emptyMessage}</h3>
                    <p>Commencez par ajouter des catégories et des objets dans la section Gestion</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredItems.map(item => {
            const category = this.categories.find(cat => cat.id === item.categoryId);
            return `
                <div class="item-card" onclick="app.openItemModal('${item.id}')">
                    <div class="item-header">
                        <h3 class="item-title">${this.escapeHtml(item.name)}</h3>
                        <div class="item-actions">
                            <button class="item-action" onclick="event.stopPropagation(); app.openItemModal('${item.id}')" title="Modifier">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                        </div>
                    </div>
                    ${item.description ? `<p class="item-description">${this.escapeHtml(item.description)}</p>` : ''}
                    <div class="item-meta">
                        <div class="item-location">
                            <span class="material-symbols-outlined">place</span>
                            <span>${this.escapeHtml(item.location || 'Non spécifié')}</span>
                        </div>
                        <span class="item-quantity">×${item.quantity}</span>
                    </div>
                    ${category ? `
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background-color: ${category.color};"></div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Mise à jour des sélecteurs de catégorie
    updateCategorySelects() {
        const selects = [
            document.getElementById('item-category'),
            document.getElementById('edit-item-category')
        ];

        selects.forEach(select => {
            if (!select) return;
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">Sélectionner une catégorie</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    // Mise à jour des chips de filtre
    updateFilterChips() {
        const container = document.querySelector('.filter-chips');
        
        let chips = `
            <div class="chip ${this.currentFilter === 'all' ? 'active' : ''}" data-category="all" onclick="app.setFilter('all')">
                <span>Toutes les catégories</span>
            </div>
        `;

        this.categories.forEach(category => {
            chips += `
                <div class="chip ${this.currentFilter === category.id ? 'active' : ''}" data-category="${category.id}" onclick="app.setFilter('${category.id}')">
                    <span style="color: ${this.currentFilter === category.id ? '#fff' : category.color};" class="material-symbols-outlined">${category.icon}</span>
                    <span>${this.escapeHtml(category.name)}</span>
                </div>
            `;
        });

        container.innerHTML = chips;
    }

    // Définir le filtre
    setFilter(categoryId) {
        this.currentFilter = categoryId;
        this.updateFilterChips();
        this.renderItems();
    }

    // Gestion des modales - Catégorie
    openCategoryModal(categoryId = null) {
        this.editingCategory = categoryId;
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        const form = document.getElementById('category-form');
        
        if (categoryId) {
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
                title.textContent = 'Modifier la catégorie';
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-color').value = category.color;
                document.getElementById('category-icon').value = category.icon;
                document.querySelectorAll('#icon-select .material-symbols-outlined').forEach(el => el.classList.remove('selected'))
                console.log(category)
                document.querySelector(`#icon-select .${category.icon}`).classList.add("selected")
            }
        } else {
            title.textContent = 'Nouvelle catégorie';
            form.reset();
        }
        
        modal.classList.add('active');
        document.getElementById('category-name').focus();
    }

    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        modal.classList.remove('active');
        this.editingCategory = null;
    }

    saveCategoryModal() {
        const name = document.getElementById('category-name').value.trim();
        const color = document.getElementById('category-color').value;
        const icon = document.getElementById('category-icon').value;

        if (!name) {
            this.showToast('Veuillez saisir un nom pour la catégorie', 'warning');
            return;
        }

        if (this.editingCategory) {
            this.editCategory(this.editingCategory, name, color, icon);
        } else {
            this.addCategory(name, color, icon);
        }

        this.closeCategoryModal();
    }

    // Gestion des modales - Objet
    openItemModal(itemId) {
        this.editingItem = itemId;
        const modal = document.getElementById('item-modal');
        const item = this.items.find(item => item.id === itemId);
        
        if (!item) return;

        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-description').value = item.description || '';
        document.getElementById('edit-item-category').value = item.categoryId;
        document.getElementById('edit-item-location').value = item.location || '';
        document.getElementById('edit-item-quantity').value = item.quantity;
        
        modal.classList.add('active');
        document.getElementById('edit-item-name').focus();
    }

    closeItemModal() {
        const modal = document.getElementById('item-modal');
        modal.classList.remove('active');
        this.editingItem = null;
    }

    saveItemModal() {
        const name = document.getElementById('edit-item-name').value.trim();
        const description = document.getElementById('edit-item-description').value.trim();
        const categoryId = document.getElementById('edit-item-category').value;
        const location = document.getElementById('edit-item-location').value.trim();
        const quantity = parseInt(document.getElementById('edit-item-quantity').value) || 1;

        if (!name || !categoryId) {
            this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }

        this.editItem(this.editingItem, name, description, categoryId, location, quantity);
        this.closeItemModal();
    }

    // Notifications toast
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const messageEl = document.querySelector('.toast-message');
        
        // Reset previous variant classes
        ['success', 'error', 'warning', 'info'].forEach(t => toast.classList.remove(t));
        if (type) toast.classList.add(type);
        
        messageEl.textContent = message;
        toast.classList.add('show');
        
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.hideToast();
        }, 4000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }

    // Stockage local
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`inventory_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showToast('Erreur lors de la sauvegarde des données', 'error');
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`inventory_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return null;
        }
    }

    // Utilitaires
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation de l'application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new InventoryApp();

    // Palette de couleurs & icônes dans la modale

    const colors = [
        "#1abc9c", // Turquoise
        "#16a085", // Green Sea
        "#2ecc71", // Emerald
        "#27ae60", // Nephritis
        "#3498db", // Peter River
        "#2980b9", // Belize Hole
        "#9b59b6", // Amethyst
        "#8e44ad", // Wisteria
        "#f1c40f", // Sun Flower
        "#f39c12", // Orange
        "#e67e22", // Carrot
        "#d35400", // Pumpkin
        "#e74c3c", // Alizarin
        "#c0392b", // Pomegranate
        "#34495e", // Wet Asphalt
        "#2c3e50"  // Midnight Blue
    ];


    const icons = [
        "home", "kitchen", "bed", "health_and_beauty", "computer", "sports_esports",
        "book_2", "music_note", "palette", "sports_basketball", "chair", "eco",
        "bolt", "construction", "directions_car", "tools_power_drill", "camera_alt",
        "restaurant", "shopping_bag", "pets", "watch", "local_florist",
        "phone_android", "brush"
    ];

    // Couleurs
    const colorPalette = document.getElementById("color-palette");
    const colorInput = document.getElementById("category-color");

    colors.forEach(c => {
        const swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.background = c;
        if (c === colorInput.value) swatch.classList.add("selected");
        swatch.addEventListener("click", () => {
            document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
            swatch.classList.add("selected");
            colorInput.value = c;
        });
        colorPalette.appendChild(swatch);
    });

    // Icônes
    const iconSelect = document.getElementById("icon-select");
    const iconInput = document.getElementById("category-icon");

    icons.forEach(icon => {
        const el = document.createElement("div");
        el.className = `icon-option material-symbols-outlined ${icon}`;
        el.textContent = icon;
        if (icon === iconInput.value) el.classList.add("selected");
        el.addEventListener("click", () => {
            document.querySelectorAll(".icon-option").forEach(i => i.classList.remove("selected"));
            el.classList.add("selected");
            iconInput.value = icon;
        });
        iconSelect.appendChild(el);
    });
});
