// Các biến toàn cục ghi nhớ bộ lọc để phục vụ phân trang
let currentCategoryPath = '';
let currentCategoryType = 'danh-sach'; 
let currentCategoryName = 'Phim mới cập nhật';

// --- BIẾN TOÀN CỤC PHỤC VỤ CAROUSEL AUTOMATIC HERO BANNER ---
let hotMoviesList = [];       
let currentHeroIndex = 0;     
let heroAutoplayTimer = null; 

document.addEventListener("DOMContentLoaded", async () => {
    const grids = {
        new: document.getElementById('newMoviesGrid'),
        china: document.getElementById('phimTrungQuocGrid'),
        korea: document.getElementById('phimHanQuocGrid'),
        horror: document.getElementById('horrorMovieGrid'), 
        series: document.getElementById('phimBoGrid'),
        single: document.getElementById('phimLeGrid'),
        anime: document.getElementById('animeGrid')
    };

    try {
        const response = await fetch('http://localhost:5000/api/movies');
        const data = await response.json();

        if (data.newMovies && data.newMovies.length > 0) {
            hotMoviesList = data.newMovies.slice(0, 5); 
            currentHeroIndex = 0;
            await renderHeroSlide(currentHeroIndex);
            startHeroAutoplay();
        }

        function renderRow(movies, gridElement) {
            if (!gridElement) return;
            gridElement.innerHTML = '';
            if (!movies || movies.length === 0) {
                gridElement.innerHTML = '<p style="color: #666; padding: 10px;">Đang cập nhật danh mục...</p>';
                return;
            }
            movies.forEach(movie => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                const labelText = movie.label.split(' - ')[0] || 'HD';
                const favClass = isFavorited(movie.slug) ? 'active' : '';

                card.innerHTML = `
                    <span class="label">${labelText}</span>
                    <span class="fav-badge ${favClass}" data-slug="${movie.slug}">❤️</span>
                    <img src="${movie.image_url}" alt="${movie.title}">
                    <span class="episode-badge">FULL</span>
                    <div class="movie-title">${movie.title}</div>
                `;

                card.querySelector('.fav-badge').onclick = (e) => {
                    e.stopPropagation();
                    toggleFavorite(movie);
                    e.target.classList.toggle('active');
                };

                card.onclick = () => openPlayerBySlug(movie.slug);
                gridElement.appendChild(card);
            });
        }

        // Bốc phim Kinh Dị
        try {
            const horrorRes = await fetch('https://ophim1.com/v1/api/the-loai/kinh-di?page=1');
            const horrorData = await horrorRes.json();
            const horrorItems = horrorData.data?.items || [];
            
            const horrorMovies = horrorItems.slice(0, 10).map(item => {
                let img = item.thumb_url;
                if (!img.startsWith('http')) img = `https://img.ophim.live/uploads/movies/${img}`;
                return { title: item.name, slug: item.slug, label: item.quality || 'HD', image_url: img };
            });
            renderRow(horrorMovies, grids.horror);
        } catch (err) { console.error(err); }

        renderRow(data.newMovies, grids.new);
        renderRow(data.phimTrungQuoc, grids.china);
        renderRow(data.phimHanQuoc, grids.korea);
        renderRow(data.phimBo, grids.series);
        renderRow(data.phimLe, grids.single);
        renderRow(data.anime, grids.anime);

    } catch (error) { console.error(error); }
});

// --- HÀM RENDER BANNER 2 LỚP HIỂN THỊ NGUYÊN POSTER PHIM CHUẨN ĐẸP ---
async function renderHeroSlide(index) {
    if (hotMoviesList.length === 0) return;
    const movie = hotMoviesList[index];
    
    try {
        const rawRes = await fetch(`https://ophim1.com/phim/${movie.slug}`);
        const rawData = await rawRes.json();
        const movieDetail = rawData.movie || {};

        const directorText = movieDetail.director ? movieDetail.director.join(', ') : 'Đang cập nhật';
        const actorText = movieDetail.actor ? movieDetail.actor.join(', ') : 'Đang cập nhật';
        const descriptionText = movieDetail.content ? movieDetail.content.replace(/<[^>]*>/g, '').slice(0, 180) : 'Nội dung bộ phim bom tấn chất lượng cao đang chiếu...';

        const heroBanner = document.getElementById('heroBanner');
        if (heroBanner) {
            heroBanner.innerHTML = `
                <div class="hero-bg-blur" style="background-image: url(${movie.image_url});"></div>
                <button class="hero-arrow hero-arrow-left" onclick="changeHeroSlide(-1); event.stopPropagation();">❮</button>
                
                <div class="hero-content">
                    <span class="hero-badge">PHIM ĐANG CHIẾU</span>
                    <h1>${movie.title}</h1>
                    <p>${descriptionText}...</p>
                    
                    <div class="hero-buttons">
                        <button class="btn-hero-vip play" id="heroPlayBtn">▶ PLAY</button>
                        <button class="btn-hero-vip fav" id="heroFavBtn">❤ YÊU THÍCH</button>
                    </div>

                    <div class="hero-meta-info">
                        <div class="hero-meta-item">🎬 <strong>Đạo diễn:</strong> ${directorText}</div>
                        <div class="hero-meta-item">⭐ <strong>Diễn viên:</strong> ${actorText}</div>
                    </div>
                </div>

                <img src="${movie.image_url}" class="hero-poster-main" alt="${movie.title}">
                
                <button class="hero-arrow hero-arrow-right" onclick="changeHeroSlide(1); event.stopPropagation();">❯</button>
            `;
            
            document.getElementById('heroPlayBtn').onclick = () => {
                localStorage.setItem('activeMovieInfo', JSON.stringify({ title: movie.title, image_url: movie.image_url, label: 'HOT' }));
                window.location.href = `detail.html?slug=${movie.slug}`;
            };
            
            const heroFavBtn = document.getElementById('heroFavBtn');
            if (isFavorited(movie.slug)) {
                heroFavBtn.innerHTML = '❤ ĐÃ LƯU TỦ';
                heroFavBtn.style.background = 'rgba(255, 204, 0, 0.2)';
            }
            heroFavBtn.onclick = () => {
                toggleFavorite(movie);
                const check = isFavorited(movie.slug);
                heroFavBtn.innerHTML = check ? '❤ ĐÃ LƯU TỦ' : '❤ YÊU THÍCH';
                heroFavBtn.style.background = check ? 'rgba(255, 204, 0, 0.2)' : 'rgba(0, 0, 0, 0.6)';
            };
        }
    } catch (err) { console.log("Lỗi dựng banner poster:", err); }
}

function changeHeroSlide(direction) {
    clearInterval(heroAutoplayTimer);
    currentHeroIndex += direction;
    if (currentHeroIndex >= hotMoviesList.length) currentHeroIndex = 0;
    if (currentHeroIndex < 0) currentHeroIndex = hotMoviesList.length - 1;
    renderHeroSlide(currentHeroIndex);
    startHeroAutoplay();
}

function startHeroAutoplay() {
    heroAutoplayTimer = setInterval(() => {
        currentHeroIndex++;
        if (currentHeroIndex >= hotMoviesList.length) currentHeroIndex = 0;
        renderHeroSlide(currentHeroIndex);
    }, 5000);
}

function scrollRow(gridId, direction) {
    const movieGrid = document.getElementById(gridId);
    if (movieGrid) movieGrid.scrollBy({ left: movieGrid.clientWidth * 0.8 * direction, behavior: 'smooth' });
}

function openPlayerBySlug(slug) {
    const clickedCard = event.currentTarget;
    const title = clickedCard.querySelector('.movie-title')?.textContent || '';
    const image_url = clickedCard.querySelector('img')?.src || '';
    const label = clickedCard.querySelector('.label')?.textContent || 'HD';
    localStorage.setItem('activeMovieInfo', JSON.stringify({ title, image_url, label }));
    clearInterval(heroAutoplayTimer); 
    window.location.href = `detail.html?slug=${slug}`;
}

async function filterMoviesByUrl(apiUrlPath, displayName, page = 1) {
    const parts = apiUrlPath.split('/');
    currentCategoryType = parts[0]; 
    currentCategoryPath = parts[1]; 
    currentCategoryName = displayName;
    await executeFilterFetch(page);
}

async function executeFilterFetch(page) {
    const mainContent = document.getElementById('mainMovieContent');
    const paginContainer = document.getElementById('paginationContainer');
    document.getElementById('heroBanner').style.display = 'none';
    clearInterval(heroAutoplayTimer);
    
    mainContent.innerHTML = `<h2>DANH MỤC: ${currentCategoryName.toUpperCase()} (TRANG ${page})</h2><div class="movie-grid" id="filterGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:20px;"></div>`;
    const filterGrid = document.getElementById('filterGrid');
    filterGrid.innerHTML = '<p style="color: #ffcc00; padding:10px;">Hệ thống đang tải dữ liệu phim bạt ngàn...</p>';

    try {
        const res = await fetch(`https://ophim1.com/v1/api/${currentCategoryType}/${currentCategoryPath}?page=${page}`);
        const result = await res.json();
        const items = result.data?.items || [];
        const paginationInfo = result.data?.params?.pagination;
        const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.totalItemsPerPage) : 1;
        
        filterGrid.innerHTML = '';

        if (items.length === 0) {
            filterGrid.innerHTML = '<p style="color: #aaa; padding:10px;">Mục này hiện đã hết phim.</p>'; return;
        }

        items.forEach(item => {
            let img = item.thumb_url;
            if (!img.startsWith('http')) img = `https://img.ophim.live/uploads/movies/${img}`;
            const movieObj = { title: item.name, slug: item.slug, label: item.quality || 'HD', image_url: img };
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            const favClass = isFavorited(item.slug) ? 'active' : '';

            card.innerHTML = `
                <span class="label">${item.quality || 'HD'}</span>
                <span class="fav-badge ${favClass}">❤️</span>
                <img src="${img}" alt="${item.name}">
                <span class="episode-badge">FULL</span>
                <div class="movie-title">${item.name}</div>
            `;
            card.querySelector('.fav-badge').onclick = (e) => {
                e.stopPropagation(); toggleFavorite(movieObj); e.target.classList.toggle('active');
            };
            card.onclick = () => openPlayerBySlug(movieObj.slug);
            filterGrid.appendChild(card);
        });

        if (paginContainer && totalPages > 1) {
            let paginHTML = '';
            if (page > 1) paginHTML += `<button onclick="executeFilterFetch(${page - 1})" style="padding: 8px 14px; background: #161618; color: #fff; border: 1px solid #333; border-radius: 4px; cursor: pointer; font-weight: bold; margin: 0 2px;">❮ Trước</button>`;
            let startPage = Math.max(1, page - 2);
            let endPage = Math.min(totalPages, page + 2);
            for (let i = startPage; i <= endPage; i++) {
                const activeStyle = (i === page) ? 'background: #e50914; border-color: #e50914;' : 'background: #161618; border-color: #333;';
                paginHTML += `<button onclick="executeFilterFetch(${i})" style="padding: 8px 14px; ${activeStyle} color: #fff; border: 1px solid; border-radius: 4px; cursor: pointer; font-weight: bold; margin: 0 2px;">${i}</button>`;
            }
            if (page < totalPages) paginHTML += `<button onclick="executeFilterFetch(${page + 1})" style="padding: 8px 14px; background: #161618; color: #fff; border: 1px solid #333; border-radius: 4px; cursor: pointer; font-weight: bold; margin: 0 2px;">Sau ❯</button>`;
            paginContainer.innerHTML = paginHTML + `<span style="color:#666; font-size:13px; margin-left:10px;">Tổng: ${totalPages} trang</span>`;
        }
    } catch (err) { filterGrid.innerHTML = '<p style="color: red; padding:10px;">Lỗi kết nối API!</p>'; }
}

async function switchCategory(categoryKey, element) {
    document.querySelectorAll('nav .nav-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    if (categoryKey === 'all') { window.location.reload(); return; }
    if (categoryKey === 'favorites') { renderFavoritePage(); return; }

    if (categoryKey === 'phimTrungQuoc') await filterMoviesByUrl('quoc-gia/trung-quoc', 'Phim Trung Quốc');
    if (categoryKey === 'phimHanQuoc') await filterMoviesByUrl('quoc-gia/han-quoc', 'Phim Hàn Quốc');
}

async function handleSearch() {
    const input = document.getElementById('searchInput').value.trim();
    const mainContent = document.getElementById('mainMovieContent');
    const paginContainer = document.getElementById('paginationContainer');
    if (input === "") return;
    document.getElementById('heroBanner').style.display = 'none';
    if (paginContainer) paginContainer.innerHTML = '';
    clearInterval(heroAutoplayTimer); 
    
    mainContent.innerHTML = `<h2>KẾT QUẢ TÌM KIẾM CHO: "${input.toUpperCase()}"</h2><div class="movie-grid" id="searchGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:25px;"></div>`;
    const searchGrid = document.getElementById('searchGrid');
    try {
        const response = await fetch(`http://localhost:5000/api/search?keyword=${encodeURIComponent(input)}`);
        const movies = await response.json();
        searchGrid.innerHTML = '';
        if (movies.length === 0) { searchGrid.innerHTML = '<p style="color: #666; padding:10px;">Không tìm thấy phim.</p>'; return; }
        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            const labelText = movie.label.split(' - ')[0] || 'HD';
            const favClass = isFavorited(movie.slug) ? 'active' : '';
            card.innerHTML = `
                <span class="label">${labelText}</span>
                <span class="fav-badge ${favClass}">❤️</span>
                <img src="${movie.image_url}" alt="${movie.title}">
                <span class="episode-badge">FULL</span>
                <div class="movie-title">${movie.title}</div>
            `;
            card.querySelector('.fav-badge').onclick = (e) => { e.stopPropagation(); toggleFavorite(movie); e.target.classList.toggle('active'); };
            card.onclick = () => openPlayerBySlug(movie.slug);
            searchGrid.appendChild(card);
        });
    } catch (error) { searchGrid.innerHTML = '<p style="color: red; padding:10px;">Lỗi hệ thống!</p>'; }
}

function getFavorites() { return JSON.parse(localStorage.getItem('myMovieFavs')) || []; }
function isFavorited(slug) { return getFavorites().some(m => m.slug === slug); }
function toggleFavorite(movie) {
    let favs = getFavorites();
    if (isFavorited(movie.slug)) { favs = favs.filter(m => m.slug !== movie.slug); } else { favs.push(movie); }
    localStorage.setItem('myMovieFavs', JSON.stringify(favs));
}

function renderFavoritePage() {
    const mainContent = document.getElementById('mainMovieContent');
    const paginContainer = document.getElementById('paginationContainer');
    const favs = getFavorites();
    document.getElementById('heroBanner').style.display = 'none';
    if (paginContainer) paginContainer.innerHTML = '';
    clearInterval(heroAutoplayTimer);
    mainContent.innerHTML = `<h2>❤️ TỦ PHIM YÊU THÍCH CỦA BẠN</h2><div class="movie-grid" id="favGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:20px;"></div>`;
    const favGrid = document.getElementById('favGrid');
    if (favs.length === 0) { favGrid.innerHTML = '<p style="color: #666; padding: 10px;">Tủ phim trống.</p>'; return; }
    favs.forEach(movie => {
        const card = document.createElement('div'); card.className = 'movie-card';
        card.innerHTML = `<span class="label">${movie.label}</span><span class="fav-badge active">❤️</span><img src="${movie.image_url}" alt="${movie.title}"><span class="episode-badge">FULL</span><div class="movie-title">${movie.title}</div>`;
        card.querySelector('.fav-badge').onclick = (e) => { e.stopPropagation(); toggleFavorite(movie); renderFavoritePage(); };
        card.onclick = () => openPlayerBySlug(movie.slug); favGrid.appendChild(card);
    });
}
function toggleFilterBar() { const bar = document.getElementById('filterBar'); if (bar) bar.style.display = (bar.style.display === 'flex') ? 'none' : 'flex'; }
function quickScroll(sectionId) { const el = document.getElementById(sectionId); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
function checkLoginStatus() {}