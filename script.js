let hotMoviesList = [];       
let currentHeroIndex = 0;     

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra tài khoản
    checkLoginStatus();

    // 2. Kiểm tra xem đang ở trang chủ hay xem phim
    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        // Nếu ở trang detail, xử lý logo trắng
        const logo = document.querySelector('.logo, .logo-group span');
        if (logo) { logo.style.color = '#ffffff'; logo.style.textDecoration = 'none'; }
    } else {
        // Tải danh sách phim và banner trang chủ
        await loadMoviesFromServer();

        // Lắng nghe nút Enter trên ô tìm kiếm dài
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') await handleSearch();
            });
            // Thêm hiệu ứng focus đổi màu giống web mẫu
            searchInput.onfocus = () => searchInput.style.borderColor = '#e50914';
            searchInput.onblur = () => searchInput.style.borderColor = '#222';
        }
    }
});

// --- TẢI PHIM & ĐỒNG BỘ BANNER ---
async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        if (data.newMovies && data.newMovies.length > 0) {
            hotMoviesList = data.newMovies.slice(0, 5);
            updateHeroBanner(currentHeroIndex);
        }

        renderMovieSection('newMoviesGrid', data.newMovies);
        renderMovieSection('phimTrungQuocGrid', data.phimTrungQuoc);
        renderMovieSection('phimHanQuocGrid', data.phimHanQuoc);
        renderMovieSection('phimBoGrid', data.phimBo);
        renderMovieSection('phimLeGrid', data.phimLe);
        renderMovieSection('animeGrid', data.anime);

    } catch (error) { console.error(error); }
}

// HÀM CẬP NHẬT BANNER: POSTER QUA PHẢI VÀ CHỮ QUA TRÁI XỊN SÒ
function updateHeroBanner(index) {
    const bgBlur = document.getElementById('heroBgBlur');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const rightPoster = document.getElementById('heroRightPoster');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (hotMoviesList.length > 0 && heroTitle) {
        const movie = hotMoviesList[index];
        
        // 1. Làm mờ nền phía sau
        if (bgBlur) bgBlur.style.backgroundImage = `url(${movie.image_url})`;
        
        // 2. Đổi chữ bên vế trái
        heroTitle.innerText = movie.title;
        heroDesc.innerText = `Chào mừng Duy đến với siêu phẩm điện ảnh hấp dẫn nhất năm. Phim chất lượng cao, tốc độ đường truyền siêu tốc ổn định, trải nghiệm rạp phim ngay tại nhà.`;
        
        // 3. Đổi ảnh poster lớn ở vế bên PHẢI
        if (rightPoster) rightPoster.src = movie.image_url;
        
        // 4. Gắn link xem phim vào nút Play
        if (heroPlayBtn) heroPlayBtn.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
    }
}

// HÀM TƯƠNG TÁC CUỘN TRÁI PHẢI BANNER BẰNG NÚT BẤM MŨI TÊN
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

// --- TÌM KIẾM ---
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

// --- ĐĂNG NHẬP PROMPT ---
function checkLoginStatus() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    if (loggedUser && loggedUser.token) {
        const avatarNode = userProfile.querySelector('.avatar');
        const usernameNode = userProfile.querySelector('.username');
        const usertypeNode = userProfile.querySelector('.usertype');
        
        if (avatarNode) avatarNode.innerText = 'D';
        if (usernameNode) usernameNode.innerText = loggedUser.username;
        if (usertypeNode) usertypeNode.innerText = 'Thành viên VIP';
        userProfile.onclick = null;
    } else {
        userProfile.onclick = () => {
            const username = prompt("Nhập tên đăng nhập:");
            if (!username) return;
            const password = prompt("Nhập mật khẩu:");
            if (!password) return;

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
                    window.location.reload();
                } else { alert(data.message); }
            });
        };
    }
}