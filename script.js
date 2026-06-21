let hotMoviesList = [];       
let currentHeroIndex = 0;     

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra trạng thái đăng nhập
    checkLoginStatus();

    // 2. Phân loại trang
    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        const logo = document.querySelector('.logo, .logo-group span');
        if (logo) { logo.style.color = '#ffffff'; logo.style.textDecoration = 'none'; }
    } else {
        // Tải dữ liệu trang chủ
        await loadMoviesFromServer();

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') await handleSearch();
            });
        }
    }
});

// --- TẢI PHIM TỪ SERVER RENDER THẬT ---
async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        // Lấy 5 phim mới nhất để chạy luân phiên trên khối Banner lớn
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

    } catch (error) { console.error(error); }
}

// --- HÀM CẬP NHẬT BANNER ẢNH NỀN CHẠY PHIM MỚI ---
async function updateHeroBanner(index) {
    const bannerBg = document.getElementById('heroBannerBg');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (hotMoviesList.length > 0 && bannerBg) {
        const movie = hotMoviesList[index];
        
        // Đổ ảnh phim trực tiếp làm hình nền thông qua thuộc tính độc lập
        bannerBg.style.backgroundImage = `url(${movie.image_url})`;
        if (heroTitle) heroTitle.innerText = movie.title;
        
        // Lấy nội dung mô tả chi tiết từ API
        try {
            const rawRes = await fetch(`https://ophim1.com/phim/${movie.slug}`);
            const rawData = await rawRes.json();
            if (heroDesc && rawData.movie) {
                heroDesc.innerText = rawData.movie.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';
            }
        } catch (e) {
            if (heroDesc) heroDesc.innerText = `Cùng thưởng thức bộ phim mới nhất ${movie.title} chất lượng hình ảnh sắc nét Full HD vietsub cực hay tại Cine NC.`;
        }

        if (heroPlayBtn) heroPlayBtn.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
    }
}

// Hàm đổi Slide Banner khi click mũi tên Trái / Phải
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

// --- TÌM KIẾM PHIM ---
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

// =========================================================================
// 🚪 HỆ THỐNG ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT QUA POPUP XỊN SÒ
// =========================================================================
let authMode = 'login';

function checkLoginStatus() {
    const userProfile = document.getElementById('profileBtn');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    const avatarNode = userProfile.querySelector('.avatar');
    const usernameNode = userProfile.querySelector('.username');
    const usertypeNode = userProfile.querySelector('.usertype');

    if (loggedUser && loggedUser.token) {
        // Trạng thái đã đăng nhập tài khoản VIP thành công
        if (avatarNode) avatarNode.innerText = 'D';
        if (usernameNode) usernameNode.innerText = loggedUser.username;
        if (usertypeNode) usertypeNode.innerText = 'Đăng xuất 🚪';
        
        // Click vào lúc này sẽ hỏi xem có muốn Đăng xuất không
        userProfile.onclick = () => {
            if (confirm("Duy có chắc chắn muốn đăng xuất tài khoản VIP không?")) {
                localStorage.removeItem('loggedUser');
                alert("👋 Đã đăng xuất thành công!");
                window.location.reload();
            }
        };
    } else {
        // Trạng thái khách chưa đăng nhập
        if (avatarNode) avatarNode.innerText = '?';
        if (usernameNode) usernameNode.innerText = 'Đăng nhập';
        if (usertypeNode) usertypeNode.innerText = 'Cá nhân';
        
        // Click mở form Popup
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
        alert("🎉 Đăng ký thành công! Hãy tiến hành đăng nhập nhé Duy.");
        openAuthModal('login');
    }
}