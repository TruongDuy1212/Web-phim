let hotMoviesList = [];       
let currentHeroIndex = 0;     
let currentPage = 1;          

document.addEventListener("DOMContentLoaded", async () => {
    checkLoginStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');
    const categoryType = urlParams.get('type');
    
    // Nếu ở trang category thì lấy số trang, mặc định là 1
    currentPage = parseInt(urlParams.get('page') || 1);

    if (movieSlug) {
        // Log xử lý trang detail (nếu cần)
    } else if (categoryType) {
        await loadCategoryPageData(categoryType, currentPage);
    } else {
        await loadMoviesFromServer();
        document.getElementById('searchInput')?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await handleSearch();
        });
    }
});

// --- 1. HỆ THỐNG DANH MỤC & PHÂN TRANG (Dùng cho category.html) ---
async function loadCategoryPageData(type, page) {
    const grid = document.getElementById('categoryMovieGrid');
    const titleHeader = document.getElementById('categoryPageTitle');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!grid) return;

    const titleMap = {
        'newMovies': '🔥 Phim Mới Cập Nhật',
        'phimTrungQuoc': '🇨🇳 Phim Trung Quốc',
        'phimHanQuoc': '🇰🇷 Phim Hàn Quốc',
        'phimBo': '🎬 Phim Bộ',
        'phimLe': '🎥 Phim Lẻ',
        'anime': '⛩️ Anime',
        'horror': '☠️ Phim Kinh Dị'
    };
    if (titleHeader) titleHeader.innerText = `${titleMap[type] || "Danh Sách Phim"} - Trang ${page}`;

    const apiMap = {
        'newMovies': 'danh-sach/phim-moi-cap-nhat',
        'phimTrungQuoc': 'quoc-gia/trung-quoc',
        'phimHanQuoc': 'quoc-gia/han-quoc',
        'phimBo': 'danh-sach/phim-bo',
        'phimLe': 'danh-sach/phim-le',
        'anime': 'danh-sach/hoat-hinh',
        'horror': 'the-loai/kinh-di'
    };

    try {
        const res = await fetch(`https://ophim1.com/v1/api/${apiMap[type]}?page=${page}&limit=28`);
        const resData = await res.json();
        const items = resData.data?.items || [];
        
        grid.innerHTML = '';
        items.forEach(item => {
            let img = item.thumb_url.startsWith('http') ? item.thumb_url : `https://img.ophim.live/uploads/movies/${item.thumb_url}`;
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => window.location.href = `detail.html?slug=${item.slug}`;
            card.innerHTML = `<div class="movie-img-container"><img src="${img}"></div><div class="movie-title">${item.name}</div>`;
            grid.appendChild(card);
        });

        if (paginationContainer) renderPagination(paginationContainer, type, page, 50);
    } catch (e) { console.error(e); }
}

function renderPagination(container, type, current, total) {
    container.innerHTML = '';
    const createBtn = (text, page, active = false) => {
        const btn = document.createElement('button');
        btn.className = `page-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.onclick = () => window.location.href = `category.html?type=${type}&page=${page}`;
        return btn;
    };
    container.appendChild(createBtn('❮', current > 1 ? current - 1 : 1, false));
    container.appendChild(createBtn(current, current, true));
    container.appendChild(createBtn('❯', current + 1, false));
}

// --- 2. HỆ THỐNG YÊU THÍCH & LỊCH SỬ ---
function saveToHistory(movie) {
    let history = JSON.parse(localStorage.getItem('myHistory')) || [];
    history = history.filter(m => m.slug !== movie.slug);
    history.unshift(movie);
    if (history.length > 20) history.pop();
    localStorage.setItem('myHistory', JSON.stringify(history));
}

function showLibrary(type) {
    const data = JSON.parse(localStorage.getItem(type === 'fav' ? 'myFavorites' : 'myHistory')) || [];
    const container = document.querySelector('.main-content');
    document.getElementById('heroBanner').style.display = 'none';
    container.innerHTML = `<h2>${type === 'fav' ? '🤍 Yêu Thích' : '🕒 Lịch Sử'}</h2>
    <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:15px; padding:0 4%;" id="libGrid"></div>`;
    data.forEach(m => {
        document.getElementById('libGrid').innerHTML += `<div class="movie-card" onclick="window.location.href='detail.html?slug=${m.slug}'"><img src="${m.image_url}"><div class="movie-title">${m.title}</div></div>`;
    });
}

// --- 3. HỆ THỐNG ĐĂNG NHẬP (GIỮ NGUYÊN) ---
function checkLoginStatus() { /* Giữ code cũ */ }
function submitAuthForm() { /* Giữ code cũ */ }

// --- 4. CÁC HÀM CŨ (BANNER, SEARCH, RENDER...) ---
async function loadMoviesFromServer() { /* Giữ code cũ */ }
async function updateHeroBanner(index) { /* Giữ code cũ */ }
function renderMovieSection(id, movies) { /* Giữ code cũ */ }
async function handleSearch() { /* Giữ code cũ */ }