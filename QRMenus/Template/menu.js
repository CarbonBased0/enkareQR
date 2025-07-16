const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.codetabs.com/v1/proxy?quest='
];

const ACCESS_KEY = 'qr-menu-bella';

const ORIGINAL_URᒪ = `https://script.google.com/macros/s/FWI5oYlMgsdgbm52BRNtFRQwnQ2PN4Vt4jtScOlM1Uyuet1gmZfX8ZX4pi4HnrsB-ct/exec${ACCESS_KEY}`

let menuData = {};

let allItems = [];
let filteredItems = [];

const categoryImages = {
    "Starters": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop",
    "Tatlılar": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop",
};

function getRestaurantId() {
    const pathSegments = window.location.pathname.split('/');
    // Extract restaurant name from path like '/QRMenus/Template/menu.html'
    const restaurantIndex = pathSegments.findIndex(segment => segment === 'QRMenus');
    if (restaurantIndex !== -1 && restaurantIndex + 1 < pathSegments.length) {
        return pathSegments[restaurantIndex + 1];
    }
    
    return ACCESS_PART;
}
function getCacheKey(type) {
    const restaurantId = getRestaurantId();
    return `${type}_${restaurantId}`;
}

function showLoading() {
    document.getElementById('loadingContainer').style.display = 'flex';
    document.getElementById('categoriesView').style.display = 'none';
    document.getElementById('menuSection').classList.remove('active');
}

function hideLoading() {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('categoriesView').style.display = 'block';
}

function shouldFetchMenuAgain() {
    const lastFetch = localStorage.getItem(getCacheKey('lastMenuFetch'));
    if (!lastFetch) return true;

    const elapsedMinutes = (Date.now() - Number(lastFetch)) / (1000 * 60);
    return elapsedMinutes > 1;
}

async function loadMenuDataWithFallback() {
    // First try direct connection
    try {
        console.log('Trying direct connection...');
        const response = await fetch(ORIGINAL_URL);
        if (response.ok) {
            console.log('Direct connection succeeded!');
            return await response.json();
        }
    } catch (error) {
        console.log('Direct connection failed, trying proxies...');
    }

    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(ORIGINAL_URL);
            console.log(`Trying proxy ${i + 1}: ${CORS_PROXIES[i]}`);
            
            const response = await fetch(proxyUrl);
            if (response.ok) {
                console.log(`Proxy ${i + 1} succeeded!`);
                return await response.json();
            }
        } catch (error) {
            console.log(`Proxy ${i + 1} failed:`, error);
        }
    }

    throw new Error('All connection methods failed');
}


async function loadMenuData() {
    if (!shouldFetchMenuAgain()) {
        console.log('Menu is recently cached. Skipping API call.');
        hideLoading()
        const cached = localStorage.getItem(getCacheKey('cachedMenuData'));
        if (cached) {
            menuData = JSON.parse(cached);
            populateCategories();
            populateAllItems();
            return;
        }
    }
    showLoading();
    try {
        console.log('Loading menu data...');
        const raw = await loadMenuDataWithFallback();
        console.log('Data loaded successfully!');

        menuData = {};
        Object.entries(raw).forEach(([cat, items]) => {
            const cover =
                categoryImages[cat] ||
                items.find(i => i.photoUrl && i.photoUrl.startsWith('http'))?.photoUrl ||
                'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?w=500&h=300&fit=crop';
            menuData[cat] = {
                image: cover,
                items: items.map(it => ({
                    name: it.name,
                    description: it.description,
                    price: `${Number(it.price).toFixed(2)}₺`,
                    photo: (it.photoUrl && it.photoUrl.startsWith('http')) 
                            ? it.photoUrl 
                            : '',
                    onMenu: it.onMenu === true
                }))
            };
        });

        localStorage.setItem(getCacheKey('cachedMenuData'), JSON.stringify(menuData));
        localStorage.setItem(getCacheKey('lastMenuFetch'), Date.now().toString());
        
        populateCategories();
        populateAllItems();
        hideLoading();
    } catch (error) {
        console.error('Failed to load menu data:', error);
        hideLoading();
        alert('Menü Yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    }
}

// Initialize the menu
function initializeMenu() {
    loadMenuData();
    setupSearch();
    setupPhotoModal();
}

function handlePopState() {
    if (document.getElementById('photoModal').classList.contains('active')) {
        closePhotoModal();
        return;
    }

    if (document.getElementById('menuSection').classList.contains('active')) {
        showCategories();
        
        return;
    }
}
window.addEventListener('popstate', handlePopState);
const ACCESS_PART = 'menu-bella';
// Populate categories
function populateCategories() {
const categoriesGrid = document.getElementById('categoriesGrid');
categoriesGrid.innerHTML = '';

const categories = Object.keys(menuData);
let index = 0;

function renderNextChunk() {
    const fragment = document.createDocumentFragment();
    let count = 0;

    // Aynı anda 3 kategori kartı oluştur
    while (index < categories.length && count < 3) {
        const category = categories[index];
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.onclick = () => showCategory(category);

        const itemCount = menuData[category].items.length;

        categoryCard.innerHTML = `
            <div class="category-background" style="background-image: url('${menuData[category].image}')"></div>
            <div class="category-overlay">
                <div class="category-content">
                    <h3 class="category-name">${category}</h3>
                    <p class="category-count">${itemCount} items</p>
                </div>
            </div>
        `;

        fragment.appendChild(categoryCard);
        index++;
        count++;
    }

    categoriesGrid.appendChild(fragment);

    // Eğer daha kategori kaldıysa sıradakileri sonra ekle
    if (index < categories.length) {
        requestAnimationFrame(renderNextChunk); // setTimeout(renderNextChunk, 0);
    }
}

renderNextChunk(); 
}
const ENCODED_URL = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3Tm9ISzMybjlWWUpMUDBEY1ZrR0N1bTRDMUkwNC0zMDJwVTRlb0lraG52RTAyam0tMldxUjhyN245dVlxbXgtY3QvZXhlYw==';
const ORIGINAL_URL = `${atob(ENCODED_URL)}?key=${ACCESS_PART}`;

function populateAllItems() {
    allItems = [];
    Object.keys(menuData).forEach(category => {
        menuData[category].items.forEach(item => {
            allItems.push({
                ...item,
                category: category
            });
        });
    });
}

function showCategory(category) {
    document.getElementById('categoriesView').style.display = 'none';
    document.getElementById('menuSection').classList.add('active');
    document.getElementById('sectionTitle').textContent = category;
    history.pushState({ view: 'category' }, '', '');

    const menuItems = document.getElementById('menuItems');
    menuItems.innerHTML = '';

    const items = [...menuData[category].items].sort((a, b) => {
        return (a.onMenu === false) - (b.onMenu === false);
    });
    let index = 0;

    function renderNextChunk() {
        const fragment = document.createDocumentFragment();
        let count = 0;

        // Aynı anda 3 öğe yükle (isteğe göre artır)
        while (index < items.length && count < 3) {
            const item = items[index];
            const hasPhoto = item.photo && item.photo.trim() !== '';
            const photoDiv = hasPhoto
                ? `<div class="item-photo" onclick="openPhotoModal('${item.photo}', '${item.name}')">
                        <img src="${item.photo}" alt="${item.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />
                </div>`
                : `<div class="item-photo no-photo"></div>`;

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item' + (item.onMenu === false ? ' faded' : '');
            menuItem.innerHTML = `
                ${photoDiv}
                <div class="item-content">
                    <div class="item-header">
                        <h3 class="item-name">${item.name}</h3>
                        <span class="item-price">${item.price}</span>
                    </div>
                    <p class="item-description">${item.description}</p>
                    ${item.category ? `<small class="item-category">From ${item.category}</small>` : ''}
                </div>
            `;

            fragment.appendChild(menuItem);
            index++;
            count++;
        }

        menuItems.appendChild(fragment);
        if (index < items.length) {
            requestAnimationFrame(renderNextChunk); // Alternatif: setTimeout(renderNextChunk, 0);
        }
    }

    renderNextChunk();
}

// Show categories view
function showCategories() {
    document.getElementById('categoriesView').style.display = 'block';
    document.getElementById('menuSection').classList.remove('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('noResults').style.display = 'none';
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            showCategories();
            return;
        }

        filteredItems = allItems.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );

        displaySearchResults(filteredItems, query);
    });
}

// Display search results
function displaySearchResults(items, query) {
    document.getElementById('categoriesView').style.display = 'none';
    document.getElementById('menuSection').classList.add('active');
    document.getElementById('sectionTitle').textContent = `Search Results for "${query}"`;

    const menuItems = document.getElementById('menuItems');
    const noResults = document.getElementById('noResults');

    if (items.length === 0) {
        menuItems.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    menuItems.innerHTML = '';

    items.slice().sort((a, b) => (a.onMenu === false) - (b.onMenu === false)).forEach(item => {
        const hasPhoto = item.photo && item.photo.trim() !== '';
        const photoDiv = hasPhoto
            ? `<div class="item-photo" onclick="openPhotoModal('${item.photo}', '${item.name}')">
                <img src="${item.photo}" alt="${item.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />
            </div>`
            : `<div class="item-photo no-photo"></div>`;


        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item' + (item.onMenu === false ? ' faded' : '');


        menuItem.innerHTML = `
            ${photoDiv}
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-name">${item.name}</h3>
                    <span class="item-price">${item.price}</span>
                </div>
                <p class="item-description">${item.description}</p>
                ${item.category ? `<small class="item-category">From ${item.category}</small>` : ''}
            </div>
        `;

        menuItems.appendChild(menuItem);
    });
}

// Photo modal functionality
function openPhotoModal(photoUrl, itemName) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    history.pushState({ view: 'photo' }, '', '');

    modalImage.src = photoUrl;
    modalImage.alt = itemName;
    modal.classList.add('active');
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    modal.classList.remove('active');
}

function setupPhotoModal() {
    const modal = document.getElementById('photoModal');
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePhotoModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closePhotoModal();
        }
    });
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    history.replaceState({ view: 'home' }, '', '');
});