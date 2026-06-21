// --- BIẾN TOÀN CỤC THEO DÕI BANNER & PHIM ---
let hotMoviesList = [];       
let currentHeroIndex = 0;     
let heroAutoplayTimer = null; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra trạng thái tài khoản ngay khi vào web
    checkLoginStatus();
    
    // 2. Tạo Form Đăng nhập / Đăng ký ngầm vào HTML nếu chưa có
    createAuthModalHTML();

    // 3. Tải phim và dựng Slide Banner
    await loadAllMovies();

    // 4. Lắng nghe ô tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await handleSearch();
        });
    }
});

// Hàm tải toàn bộ dữ liệu từ Render API thật
async function loadAllMovies() {
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
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        // Cài đặt danh sách cho Slide Banner lớn
        if (data.newMovies && data.newMovies.length > 0) {
            hotMoviesList = data.newMovies.slice(0, 5); 
            currentHeroIndex = 0;
            await renderHeroSlide(currentHeroIndex);
            startHeroAutoplay();
        }

        // Đổ dữ liệu phim vào các hàng Grid chuẩn theo ID gốc của Duy
        renderRow(data.newMovies, grids.new);
        renderRow(data.phimTrungQuoc, grids.china);
        renderRow(data.phimHanQuoc, grids.korea);
        renderRow(data.phimBo, grids.series);
        renderRow(data.phimLe, grids.single);
        renderRow(data.anime, grids.anime);

        // Bốc riêng danh mục Kinh Dị từ API ngầm
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

    } catch (error) {
        console.error("Lỗi kết nối API Render:", error);
    }
}

// Hàm render hàng phim dùng chung
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
        const labelText = movie.label ? movie.label.split(' - ')[0] : 'HD';
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

// --- HÀM RENDER HERO BANNER 2 LỚP HIỂN THỊ TRỌN POSTER ---
async function renderHeroSlide(index) {
    if (hotMoviesList.length === 0) return;
    const movie = hotMoviesList[index];
    try {
        const rawRes = await fetch(`https://ophim1.com/phim/${movie.slug}`);
        const rawData = rawRes.json ? await rawRes.json() : rawRes;
        const movieDetail = rawData.movie || {};

        const directorText = movieDetail.director ? movieDetail.director.join(', ') : 'Đang cập nhật';
        const actorText = movieDetail.actor ? movieDetail.actor.join(', ') : 'Đang cập nhật';
        const descriptionText = movieDetail.content ? movieDetail.content.replace(/<[^>]*>/g, '').slice(0, 180) : 'Nội dung bộ phim bom tấn...';

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
            
            document.getElementById('heroPlayBtn').onclick = () => openPlayerBySlug(movie.slug);
            
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
    } catch (err) { console.log(err); }
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

function openPlayerBySlug(slug) {
    clearInterval(heroAutoplayTimer); 
    window.location.href = `detail.html?slug=${slug}`;
}

// --- HỆ THỐNG ĐĂNG NHẬP / ĐĂNG KÝ MỚI TINH ---
function checkLoginStatus() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));

    if (loggedUser && loggedUser.token) {
        userProfile.innerHTML = `
            <div class="avatar" style="background: #e50914;">D</div>
            <div class="user-info">
                <span class="username">${loggedUser.username}</span>
                <span class="usertype">${loggedUser.usertype || 'Thành viên VIP'}</span>
            </div>
            <span class="logout-icon" title="Đăng xuất" onclick="handleLogout(event)" style="margin-left:8px; font-size:14px;">🚪</span>
        `;
        userProfile.onclick = null;
    } else {
        userProfile.innerHTML = `
            <div class="avatar" style="background: #444;">?</div>
            <div class="user-info">
                <span class="username" style="color: #ffcc00;">Đăng nhập</span>
                <span class="usertype">Khách qua đường</span>
            </div>
        `;
        userProfile.onclick = () => openAuthModal('login');
    }
}

function createAuthModalHTML() {
    if (document.getElementById('authModal')) return;
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.style = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;";
    
    modal.innerHTML = `
        <div style="background:#161618; padding:30px; border-radius:8px; width:100%; max-width:380px; border:1px solid #333; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
            <span onclick="closeAuthModal()" style="position:absolute; top:15px; right:15px; color:#aaa; cursor:pointer; font-size:18px;">✕</span>
            <h3 id="authTitle" style="margin-top:0; color:#fff; font-size:22px; text-align:center; margin-bottom:20px;">Đăng Nhập Rạp Phim</h3>
            
            <div style="margin-bottom:15px;">
                <label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">TÊN TÀI KHOẢN</label>
                <input type="text" id="authUser" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:4px; outline:none;">
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">MẬT KHẨU</label>
                <input type="password" id="authPass" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:4px; outline:none;">
            </div>
            
            <button id="authSubmitBtn" onclick="submitAuthForm()" style="width:100%; padding:12px; background:#e50914; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:15px;">ĐĂNG NHẬP</button>
            
            <p id="authSwitchText" style="color:#aaa; text-align:center; font-size:13px; margin-top:20px; margin-bottom:0;">
                Chưa có tài khoản? <span onclick="openAuthModal('register')" style="color:#ffcc00; cursor:pointer; text-decoration:underline;">Đăng ký ngay</span>
            </p>
        </div>
    `;
    document.body.appendChild(modal);
}

let authMode = 'login';
function openAuthModal(mode) {
    authMode = mode;
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');
    const switchTxt = document.getElementById('authSwitchText');
    
    if (!modal) return;
    modal.style.display = 'flex';
    
    if (mode === 'login') {
        title.innerText = "Đăng Nhập Rạp Phim";
        btn.innerText = "ĐĂNG NHẬP";
        switchTxt.innerHTML = `Chưa có tài khoản? <span onclick="openAuthModal('register')" style="color:#ffcc00; cursor:pointer; text-decoration:underline;">Đăng ký ngay</span>`;
    } else {
        title.innerText = "Đăng Ký Tài Khoản";
        btn.innerText = "TẠO TÀI KHOẢN MỚI";
        switchTxt.innerHTML = `Đã có tài khoản rồi? <span onclick="openAuthModal('login')" style="color:#ffcc00; cursor:pointer; text-decoration:underline;">Đăng nhập</span>`;
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function submitAuthForm() {
    const username = document.getElementById('authUser').value.trim();
    const password = document.getElementById('authPass').value.trim();
    
    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu!");
        return;
    }

    if (authMode === 'login') {
        // Gửi lệnh Đăng nhập lên API Render
        fetch('https://cinematic-3gsh.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('loggedUser', JSON.stringify(data));
                alert("🎉 Đăng nhập rạp phim VIP thành công!");
                closeAuthModal();
                checkLoginStatus();
            } else {
                alert(data.message);
            }
        });
    } else {
        // Xử lý Đăng ký (Lưu tài khoản ngầm vào LocalStorage của hệ thống Cloud)
        let localUsers = JSON.parse(localStorage.getItem('localUsersList')) || [];
        if (localUsers.some(u => u.username === username) || username === "TruongDuyVIP") {
            alert("Tên tài khoản này đã có người đăng ký rồi Duy ơi!");
            return;
        }
        localUsers.push({ username, password });
        localStorage.setItem('localUsersList', JSON.stringify(localUsers));
        alert("🎉 Đăng ký tài khoản mới thành công! Giờ bạn có thể đăng nhập.");
        openAuthModal('login');
    }
}

function handleLogout(event) {
    event.stopPropagation();
    if (confirm("Duy có chắc muốn đăng xuất tài khoản không?")) {
        localStorage.removeItem('loggedUser');
        alert("👋 Đã đăng xuất tài khoản thành công!");
        window.location.reload();
    }
}

// --- QUẢN LÝ DANH SÁCH YÊU THÍCH ---
function getFavorites() { return JSON.parse(localStorage.getItem('myMovieFavs')) || []; }
function isFavorited(slug) { return getFavorites().some(m => m.slug === slug); }
function toggleFavorite(movie) {
    let favs = getFavorites();
    if (isFavorited(movie.slug)) { favs = favs.filter(m => m.slug !== movie.slug); } else { favs.push(movie); }
    localStorage.setItem('myMovieFavs', JSON.stringify(favs));
}