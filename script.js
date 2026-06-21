document.addEventListener("DOMContentLoaded", async () => {
    // Chạy kiểm tra trạng thái đăng nhập đầu tiên
    checkLoginStatus();
    
    // Gọi tải danh sách phim từ Render API thật
    await loadMovies();

    // Lắng nghe sự kiện tìm kiếm phim
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleSearch();
            }
        });
    }
});

// Hàm tải phim chính từ Render Cloud
async function loadMovies() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        renderMovieSection('new-movies-grid', data.newMovies);
        renderMovieSection('phim-trung-quoc-grid', data.phimTrungQuoc);
        renderMovieSection('phim-han-quoc-grid', data.phimHanQuoc);
        renderMovieSection('phim-hanh-dong-grid', data.phimHanhDong);
        renderMovieSection('anime-grid', data.anime);
        renderMovieSection('phim-le-grid', data.phimLe);
        renderMovieSection('phim-bo-grid', data.phimBo);
    } catch (error) {
        console.error("Lỗi khi tải danh sách phim từ Cloud Render:", error);
    }
}

// Hàm render thẻ phim ra HTML
function renderMovieSection(elementId, movies) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    grid.innerHTML = '';

    if (!movies || movies.length === 0) {
        grid.innerHTML = '<p class="no-data">Đang cập nhật phim...</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => openMovieDetail(movie.slug, movie.title, movie.image_url);

        card.innerHTML = `
            <div class="movie-img-container">
                <img src="${movie.image_url}" alt="${movie.title}" loading="lazy">
                <span class="movie-label">${movie.label}</span>
            </div>
            <div class="movie-title">${movie.title}</div>
        `;
        grid.appendChild(card);
    });
}

// Hàm xử lý tìm kiếm phim từ Render API thật
async function handleSearch() {
    const input = document.getElementById('search-input').value.trim();
    const searchSection = document.getElementById('search-result-section');
    const searchGrid = document.getElementById('search-movies-grid');

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
                searchGrid.innerHTML = '<p class="no-data">Không tìm thấy phim phù hợp.</p>';
            } else {
                movies.forEach(movie => {
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    card.onclick = () => openMovieDetail(movie.slug, movie.title, movie.image_url);
                    card.innerHTML = `
                        <div class="movie-img-container">
                            <img src="${movie.image_url}" alt="${movie.title}">
                            <span class="movie-label">${movie.label}</span>
                        </div>
                        <div class="movie-title">${movie.title}</div>
                    `;
                    searchGrid.appendChild(card);
                });
            }
            searchSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
    }
}

// Hàm mở modal chi tiết phim và tập phim
async function openMovieDetail(slug, title, imageUrl) {
    const modal = document.getElementById('movie-modal');
    if (!modal) return;

    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-img').src = imageUrl;
    document.getElementById('modal-desc').innerText = "Đang tải nội dung mô tả...";
    document.getElementById('episode-list').innerHTML = "Đang tải danh sách tập...";

    modal.style.display = 'block';

    try {
        const response = await fetch(`https://cinematic-3gsh.onrender.com/api/movie-detail?slug=${slug}`);
        const data = await response.json();

        document.getElementById('modal-desc').innerText = data.description;
        const epList = document.getElementById('episode-list');
        epList.innerHTML = '';

        if (!data.episodes || data.episodes.length === 0) {
            epList.innerHTML = '<p>Phim đang được cập nhật tập mới.</p>';
            return;
        }

        data.episodes.forEach(ep => {
            const btn = document.createElement('button');
            btn.className = 'ep-btn';
            btn.innerText = ep.name;
            btn.onclick = () => {
                const playerSection = document.getElementById('video-player-section');
                const iframe = document.getElementById('video-iframe');
                if (playerSection && iframe) {
                    iframe.src = ep.link;
                    playerSection.style.display = 'block';
                    playerSection.scrollIntoView({ behavior: 'smooth' });
                }
            };
            epList.appendChild(btn);
        });
    } catch (error) {
        console.error("Lỗi chi tiết phim:", error);
    }
}

function closeModal() {
    const modal = document.getElementById('movie-modal');
    if (modal) modal.style.display = 'none';
    const iframe = document.getElementById('video-iframe');
    if (iframe) iframe.src = '';
    const playerSection = document.getElementById('video-player-section');
    if (playerSection) playerSection.style.display = 'none';
}

// --- HỆ THỐNG KIỂM TRA ĐĂNG NHẬP / ĐĂNG XUẤT (MỚI THÊM) ---
function checkLoginStatus() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));

    if (loggedUser && loggedUser.token) {
        userProfile.innerHTML = `
            <div class="avatar" style="background: #ffcc00; color: #000; font-weight: bold;">D</div>
            <div class="user-info">
                <span class="username" style="font-weight: bold; color: #fff;">${loggedUser.username}</span>
                <span class="usertype" style="color: #ffcc00; font-size: 11px;">${loggedUser.usertype}</span>
            </div>
            <span class="logout-icon" title="Đăng xuất" onclick="handleLogout(event)" style="margin-left: 12px; cursor: pointer; font-size: 16px;">🚪</span>
        `;
        userProfile.onclick = null; 
    } else {
        userProfile.innerHTML = `
            <div class="avatar" style="background: #444; color: #aaa;">?</div>
            <div class="user-info">
                <span class="username" style="color: #ffcc00; font-weight: bold;">Đăng nhập</span>
                <span class="usertype" style="color: #888; font-size: 11px;">Khách qua đường</span>
            </div>
        `;
        userProfile.onclick = () => {
            const username = prompt("Nhập tên đăng nhập (Mặc định: TruongDuyVIP):");
            if (!username) return;
            const password = prompt("Nhập mật khẩu (Mặc định: 123):");
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
                    alert("🎉 Đăng nhập hệ thống rạp phim VIP thành công!");
                    checkLoginStatus();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => alert("Lỗi kết nối server!"));
        };
    }
}

function handleLogout(event) {
    event.stopPropagation();
    if (confirm("Duy có chắc muốn đăng xuất tài khoản VIP không?")) {
        localStorage.removeItem('loggedUser');
        alert("👋 Đã đăng xuất tài khoản!");
        window.location.reload();
    }
}