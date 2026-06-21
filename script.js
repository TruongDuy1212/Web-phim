let hotMoviesList = [];       
let currentHeroIndex = 0;     
let currentPage = 1;          // Theo dõi trang hiện tại Duy đang xem

document.addEventListener("DOMContentLoaded", async () => {
    checkLoginStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');
    const categoryType = urlParams.get('type');
    const pageParam = urlParams.get('page');
    
    if (pageParam) {
        currentPage = parseInt(pageParam);
    } else {
        currentPage = 1;
    }

    if (movieSlug) {
        const logo = document.querySelector('.logo, .logo-group span');
        if (logo) { logo.style.color = '#ffffff'; logo.style.textDecoration = 'none'; }
    } else if (categoryType) {
        // --- ĐANG Ở TRANG CATEGORY.HTML $\rightarrow$ TẢI PHIM PHÂN TRANG KHÍT LƯỚI ---
        await loadCategoryPageData(categoryType, currentPage);
    } else {
        await loadMoviesFromServer();

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') await handleSearch();
            });
        }
    }
});

// =========================================================================
// 🌐 KHỐI XỬ LÝ LẤY ĐỦ PHIM ĐỂ KHÍT LƯỚI (MỖI HÀNG TRÒN 7 PHIM)
// =========================================================================
async function loadCategoryPageData(type, page) {
    const grid = document.getElementById('categoryMovieGrid');
    const titleHeader = document.getElementById('categoryPageTitle');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!grid || !titleHeader) return;

    // Bảng cấu hình tên hiển thị tiêu đề danh mục
    const titleMap = {
        'newMovies': '🔥 Toàn Bộ Phim Mới Cập Nhật',
        'phimTrungQuoc': '🇨🇳 Toàn Bộ Phim Trung Quốc Chọn Lọc',
        'phimHanQuoc': '🇰🇷 Toàn Bộ Phim Hàn Quốc Lãng Mạn',
        'phimBo': '🎬 Toàn Bộ Danh Sách Phim Bộ Dài Tập',
        'phimLe': '🎥 Toàn Bộ Kho Phim Lẻ Chọn Lọc',
        'anime': '⛩️ Toàn Bộ Thế Giới Phim Hoạt Hình Anime',
        'horror': '☠️ Toàn Bộ Khối Phim Kinh Dị Rùng Rợn'
    };
    titleHeader.innerText = `${titleMap[type] || "Danh Sách Phim"} - Trang ${page}`;

    // Ép API OPhim v1 trả về số lượng phim lớn hơn (limit=28 phim để chia hết cho 7 phim/hàng)
    let targetApiUrl = '';
    if (type === 'newMovies') {
        targetApiUrl = `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}&limit=28`;
    } else if (type === 'phimTrungQuoc') {
        targetApiUrl = `https://ophim1.com/v1/api/quoc-gia/trung-quoc?page=${page}&limit=28`;
    } else if (type === 'phimHanQuoc') {
        targetApiUrl = `https://ophim1.com/v1/api/quoc-gia/han-quoc?page=${page}&limit=28`;
    } else if (type === 'phimBo') {
        targetApiUrl = `https://ophim1.com/v1/api/danh-sach/phim-bo?page=${page}&limit=28`;
    } else if (type === 'phimLe') {
        targetApiUrl = `https://ophim1.com/v1/api/danh-sach/phim-le?page=${page}&limit=28`;
    } else if (type === 'anime') {
        targetApiUrl = `https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=${page}&limit=28`;
    } else if (type === 'horror') {
        targetApiUrl = `https://ophim1.com/v1/api/the-loai/kinh-di?page=${page}&limit=28`;
    }

    try {
        grid.innerHTML = '<p style="color:#aaa; padding: 20px 0;">Hệ thống đang đồng bộ kho phim bạt ngàn cho khít giao diện...</p>';
        
        const res = await fetch(targetApiUrl);
        const resData = await res.json();
        
        let items = resData.data?.items || resData.items || [];
        const paginationInfo = resData.data?.params?.pagination || {};
        
        // Thuật toán lấy tròn số phim lấp đầy: nếu có nhiều hơn 14 phim, lấy tròn 14 hoặc 21 hoặc 28 phim để chia hết cho 7
        if (items.length > 14) {
            if (items.length >= 28) {
                items = items.slice(0, 28); // Đủ 4 hàng, mỗi hàng 7 phim
            } else if (items.length >= 21) {
                items = items.slice(0, 21); // Đủ 3 hàng, mỗi hàng 7 phim
            } else {
                items = items.slice(0, 14); // Đủ 2 hàng, mỗi hàng 7 phim khít rịt
            }
        }

        // Tính toán tổng số trang dựa trên dữ liệu thật
        const totalItems = paginationInfo.totalItemsCount || 200;
        const totalPages = Math.ceil(totalItems / 28) || 15;

        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = '<p style="color:#aaa;">Danh mục này đang cập nhật phim.</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Tạo layout lưới phim đồng bộ bo góc cực nét
        items.forEach(item => {
            let img = item.thumb_url || '';
            if (img && !img.startsWith('http')) {
                img = `https://img.ophim.live/uploads/movies/${img}`;
            }

            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => window.location.href = `detail.html?slug=${item.slug}`;
            card.innerHTML = `
                <div class="movie-img-container"><img src="${img}" alt="${item.name}"></div>
                <div class="movie-title">${item.name}</div>
            `;
            grid.appendChild(card);
        });

        // Cập nhật lại thanh điều hướng trang ở dưới cùng
        if (paginationContainer) {
            renderPaginationControls(paginationContainer, type, page, totalPages);
        }

    } catch (e) { 
        console.error("Lỗi đồng bộ dữ liệu phim:", e); 
        grid.innerHTML = '<p style="color:#e50914;">Lỗi kết nối rạp phim. Duy nhấn F5 tải lại trang xem nhé!</p>';
    }
}

// Vẽ thanh phân trang động mượt mà
function renderPaginationControls(container, type, currentPage, totalPages) {
    container.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '❮ Trước';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => window.location.href = `category.html?type=${type}&page=${currentPage - 1}`;
    container.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i < 1) continue;
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.onclick = () => window.location.href = `category.html?type=${type}&page=${i}`;
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = 'Sau ❯';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => window.location.href = `category.html?type=${type}&page=${currentPage + 1}`;
    container.appendChild(nextBtn);
}

// --- TẢI PHIM TRANG CHỦ INDEX.HTML ---
async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        if (data.newMovies && data.newMovies.length > 0) {
            hotMoviesList = data.newMovies.slice(0, 5);
            updateHeroBanner(0);
        }

        renderMovieSection('newMoviesGrid', data.newMovies);
        renderMovieSection('phimTrungQuocGrid', data.phimTrungQuoc);
        renderMovieSection('phimHanQuocGrid', data.phimHanQuoc);
        renderMovieSection('phimBoGrid', data.phimBo);
        renderMovieSection('phimLeGrid', data.phimLe);
        renderMovieSection('animeGrid', data.anime);

        try {
            const horrorRes = await fetch('https://ophim1.com/v1/api/the-loai/kinh-di?page=1');
            const horrorData = await horrorRes.json();
            const horrorMovies = (horrorData.data?.items || []).slice(0, 10).map(item => {
                let img = item.thumb_url;
                if (!img.startsWith('http')) img = `https://img.ophim.live/uploads/movies/${img}`;
                return { title: item.name, slug: item.slug, image_url: img };
            });
            renderMovieSection('horrorMovieGrid', horrorMovies);
        } catch (e) { console.log(e); }

    } catch (error) { console.error(error); }
}

async function updateHeroBanner(index) {
    const bannerBg = document.getElementById('heroBannerBg');
    const rightPoster = document.getElementById('heroRightPoster');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (hotMoviesList.length > 0 && bannerBg) {
        const movie = hotMoviesList[index];
        bannerBg.style.backgroundImage = `url(${movie.image_url})`;
        if (rightPoster) rightPoster.src = movie.image_url;
        if (heroTitle) heroTitle.innerText = movie.title;
        
        try {
            const rawRes = await fetch(`https://ophim1.com/phim/${movie.slug}`);
            const rawData = await rawRes.json();
            if (heroDesc && rawData.movie) {
                heroDesc.innerText = rawData.movie.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';
            }
        } catch (e) {
            if (heroDesc) heroDesc.innerText = `Cùng thưởng thức bộ phim mới nhất ${movie.title} chất lượng hình ảnh sắc nét Full HD vietsub cực hay tại Cinematic.`;
        }
        if (heroPlayBtn) heroPlayBtn.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
    }
}

function changeHeroSlide(direction) {
    currentHeroIndex += direction;
    if (currentHeroIndex >= hotMoviesList.length) currentHeroIndex = 0;
    if (currentHeroIndex < 0) currentHeroIndex = hotMoviesList.length - 1;
    updateHeroBanner(currentHeroIndex);
}

function renderMovieSection(elementId, movies) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    grid.innerHTML = '';
    if (!movies || movies.length === 0) return;

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
        card.innerHTML = `
            <div class="movie-img-container"><img src="${movie.image_url}" alt="${movie.title}"></div>
            <div class="movie-title">${movie.title}</div>
        `;
        grid.appendChild(card);
    });
}

async function handleSearch() {
    const input = document.getElementById('searchInput').value.trim();
    const searchSection = document.getElementById('searchResultSection');
    const searchGrid = document.getElementById('searchMoviesGrid');

    if (!input) {
        if (searchSection) searchSection.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://cinematic-3gsh.onrender.com/api/search?keyword=${encodeURIComponent(input)}`);
        const movies = await response.json();

        if (searchSection && searchGrid) {
            searchSection.style.display = 'block';
            searchGrid.innerHTML = '';
            if (movies.length === 0) {
                searchGrid.innerHTML = '<p style="color: #aaa; padding: 10px;">Không tìm thấy phim.</p>';
            } else {
                movies.forEach(movie => {
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    card.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
                    card.innerHTML = `
                        <img src="${movie.image_url}" alt="${movie.title}">
                        <div class="movie-title">${movie.title}</div>
                    `;
                    searchGrid.appendChild(card);
                });
            }
            searchSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) { console.error(error); }
}

function checkLoginStatus() {
    const userProfile = document.getElementById('profileBtn');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    const avatarNode = userProfile.querySelector('.avatar');
    const usernameNode = userProfile.querySelector('.username');
    const usertypeNode = userProfile.querySelector('.usertype');

    if (loggedUser && loggedUser.token) {
        if (avatarNode) avatarNode.innerText = 'D';
        if (usernameNode) usernameNode.innerText = loggedUser.username;
        if (usertypeNode) usertypeNode.innerText = 'Đăng xuất 🚪';
        
        userProfile.onclick = () => {
            if (confirm("Duy có chắc chắn muốn đăng xuất không?")) {
                localStorage.removeItem('loggedUser');
                alert("👋 Đã đăng xuất thành công!");
                window.location.reload();
            }
        };
    } else {
        if (avatarNode) avatarNode.innerText = '?';
        if (usernameNode) usernameNode.innerText = 'Đăng nhập';
        if (usertypeNode) usertypeNode.innerText = 'Cá nhân';
        userProfile.onclick = () => openAuthModal('login');
    }
}

function openAuthModal(mode) {
    authMode = mode;
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');
    const switchTxt = document.getElementById('authSwitchText');
    if (!modal) return;
    
    modal.style.display = 'flex';
    if (mode === 'login') {
        title.innerText = "Đăng Nhập Hệ Thống";
        btn.innerText = "ĐĂNG NHẬP VÀO RẠP";
        switchTxt.innerHTML = `Chưa có tài khoản? <span onclick="openAuthModal('register')">Đăng ký ngay</span>`;
    } else {
        title.innerText = "Đăng Ký Thành Viên";
        btn.innerText = "TẠO TÀI KHOẢN MỚI";
        switchTxt.innerHTML = `Đã có tài khoản rồi? <span onclick="openAuthModal('login')">Quay lại Đăng nhập</span>`;
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function submitAuthForm() {
    const username = document.getElementById('authUser').value.trim();
    const password = document.getElementById('authPass').value.trim();
    if (!username || !password) { alert("Vui lòng nhập đầy đủ thông tin!"); return; }

    if (authMode === 'login') {
        fetch('https://cinematic-3gsh.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('loggedUser', JSON.stringify(data));
                alert("🎉 Đăng nhập thành công!");
                closeAuthModal();
                window.location.reload();
            } else { alert(data.message); }
        });
    } else {
        let localUsers = JSON.parse(localStorage.getItem('registeredUsersList')) || [];
        if (localUsers.some(u => u.username === username) || username === "TruongDuyVIP") {
            alert("Tên tài khoản này đã được sử dụng!");
            return;
        }
        localUsers.push({ username, password });
        localStorage.setItem('registeredUsersList', JSON.stringify(localUsers));
        alert("🎉 Đăng ký thành công! Hãy tiến hành đăng nhập.");
        openAuthModal('login');
    }
}