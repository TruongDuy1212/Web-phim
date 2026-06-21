// --- BIẾN TOÀN CỤC THEO DÕI BANNER & PHIM ---
let hotMoviesList = [];       
let currentHeroIndex = 0;     

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra trạng thái tài khoản của người dùng
    checkLoginStatus();

    // 2. Kiểm tra xem đang ở trang chủ (index) hay trang xem phim (detail) bằng URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        // --- ĐANG Ở TRANG XEM PHIM DETAIL.HTML ---
        await loadMovieDetailFromServer(movieSlug);
    } else {
        // --- ĐANG Ở TRANG CHỦ INDEX.HTML ---
        await loadMoviesFromServer();

        // Lắng nghe nút Enter trên ô tìm kiếm (Chỉ chạy ở trang chủ)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') await handleSearch();
            });
        }
    }

    // 3. SỬA LOGO TRANG XEM PHIM: Ép logo từ màu xanh dương có gạch chân về màu trắng sang trọng
    const logoLink = document.querySelector('.logo, a[href*="index.html"]');
    if (logoLink) {
        logoLink.style.color = '#ffffff';
        logoLink.style.textDecoration = 'none';
    }
});

// =========================================================================
// 🎬 KHỐI 1: XỬ LÝ LOGIC TRANG CHI TIẾT (FIX MẤT POSTER, NỘI DUNG & TẬP PHIM)
// =========================================================================
async function loadMovieDetailFromServer(slug) {
    try {
        // Gọi API Render của Duy để bốc nội dung mô tả tóm tắt phim
        const response = await fetch(`https://cinematic-3gsh.onrender.com/api/movie-detail?slug=${slug}`);
        const data = await response.json();

        // 1. Đổ nội dung giới thiệu phim
        const descElement = document.getElementById('modal-desc') || document.querySelector('.content-text') || document.querySelector('.introduction-box p') || document.getElementById('movieDesc') || document.querySelector('p');
        if (descElement) {
            descElement.innerText = data.description || "Đang cập nhật nội dung tóm tắt từ hệ thống...";
        }

        // 2. Đổ danh sách nút bấm chọn tập phim
        const epListContainer = document.getElementById('episode-list') || document.querySelector('.choose-episode-grid') || document.getElementById('episodeContainer') || document.querySelector('.episode-grid') || document.getElementById('episode-grid');
        if (epListContainer) {
            epListContainer.innerHTML = '';
            
            if (!data.episodes || data.episodes.length === 0) {
                epListContainer.innerHTML = '<p style="color:#aaa; padding:10px;">Phim đang được cập nhật thêm tập mới.</p>';
            } else {
                data.episodes.forEach(ep => {
                    const btn = document.createElement('button');
                    btn.className = 'ep-btn';
                    
                    // Style cho nút bấm tập phim nhìn nổi bật và đồng bộ màu đỏ rạp phim
                    btn.style = "padding: 10px 18px; background: #1f1f22; color: #fff; border: 1px solid #333; border-radius: 4px; margin: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;";
                    btn.innerText = ep.name;
                    
                    btn.onmouseover = () => btn.style.background = '#e50914';
                    btn.onmouseout = () => btn.style.background = '#1f1f22';

                    // Khi Duy bấm vào tập phim, video sẽ chạy mượt mà trên iframe trình phát
                    btn.onclick = () => {
                        let player = document.getElementById('video-iframe') || document.getElementById('player') || document.querySelector('iframe');
                        let playerSection = document.getElementById('video-player-section') || document.querySelector('.player-container') || document.querySelector('.video-box');
                        
                        if (player) {
                            player.src = ep.link;
                            if (playerSection) playerSection.style.display = 'block';
                            player.scrollIntoView({ behavior: 'smooth' }); // Tự động cuộn mượt lên khung video
                        } else {
                            // Phòng hờ nếu cấu trúc iframe của bạn nằm ở khối khác
                            window.open(ep.link, '_blank');
                        }
                    };
                    epListContainer.appendChild(btn);
                });
            }
        }

        // 3. ÉP LẤY POSTER VÀ TÊN PHIM THẬT TỪ API (BỎ CHỮ LOADING VÀ DÒNG CHỮ XẤU)
        const posterImg = document.getElementById('modal-img') || document.querySelector('.poster-main-img') || document.querySelector('.poster img') || document.querySelector('.movie-thumb img') || document.querySelector('img');
        const titleElement = document.getElementById('modal-title') || document.querySelector('.movie-detail-info h1') || document.querySelector('.title-detail') || document.querySelector('.movie-info h1') || document.querySelector('h1');
        
        const rawRes = await fetch(`https://ophim1.com/phim/${slug}`);
        const rawData = await rawRes.json();
        
        if (rawData.movie) {
            // Cập nhật tên phim thật thay cho chữ Loading...
            if (titleElement) titleElement.innerText = rawData.movie.name;
            
            // Cập nhật ảnh poster thật từ kho API
            if (posterImg) {
                let imgUrl = rawData.movie.thumb_url;
                if (!imgUrl.startsWith('http')) imgUrl = `https://img.ophim.live/uploads/movies/${imgUrl}`;
                posterImg.src = imgUrl;
                posterImg.alt = rawData.movie.name;
            }

            // Quét sạch các chữ kẹt "Đang tải...", "Loading..." do file cũ để lại trên màn hình
            document.body.innerHTML = document.body.innerHTML
                .replace('Đang tải...', rawData.movie.episode_current || 'Full HD')
                .replace('Loading...', rawData.movie.name);
        }

    } catch (error) {
        console.error("Lỗi tải chi tiết trang phim:", error);
    }
}

// =========================================================================
// 🌐 KHỐI 2: XỬ LÝ ĐỔ DỮ LIỆU PHIM LÊN GIAO DIỆN TRANG CHỦ INDEX.HTML
// =========================================================================
async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        // Bốc 5 phim hot mới nhất làm nền cho khối Banner lớn giữa trang
        if (data.newMovies && data.newMovies.length > 0) {
            hotMoviesList = data.newMovies.slice(0, 5);
            updateHeroBanner(0);
        }

        // Đổ phim khớp chuẩn xác vào đúng các ID hàng lưới cũ của Duy
        renderMovieSection('newMoviesGrid', data.newMovies);
        renderMovieSection('phimTrungQuocGrid', data.phimTrungQuoc);
        renderMovieSection('phimHanQuocGrid', data.phimHanQuoc);
        renderMovieSection('phimBoGrid', data.phimBo);
        renderMovieSection('phimLeGrid', data.phimLe);
        renderMovieSection('animeGrid', data.anime);

        // Bốc danh mục phim Kinh Dị
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

    } catch (error) {
        console.error("Lỗi kết nối máy chủ Render trang chủ:", error);
    }
}

// Hàm cập nhật hình ảnh và chữ cho Banner lớn nằm giữa trang chủ
function updateHeroBanner(index) {
    const heroBanner = document.getElementById('heroBanner');
    const heroTitle = document.getElementById('heroTitle');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (hotMoviesList.length > 0 && heroBanner) {
        const movie = hotMoviesList[index];
        // Đổ ảnh nền bự kèm lớp phủ gradient bóng mờ cho chữ nổi lên siêu đẹp
        heroBanner.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), #000), url(${movie.image_url})`;
        heroBanner.style.backgroundSize = 'cover';
        heroBanner.style.backgroundPosition = 'center';
        
        if (heroTitle) heroTitle.innerText = movie.title;
        if (heroPlayBtn) heroPlayBtn.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
    }
}

function renderMovieSection(elementId, movies) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    grid.innerHTML = '';
    if (!movies || movies.length === 0) return;

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        // Truyền tham số ?slug= sang trang sau để trang detail bắt được dữ liệu phim
        card.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
        
        card.innerHTML = `
            <div class="movie-img-container">
                <img src="${movie.image_url}" alt="${movie.title}" loading="lazy">
            </div>
            <div class="movie-title">${movie.title}</div>
        `;
        grid.appendChild(card);
    });
}

// =========================================================================
// 🔍 KHỐI 3: XỬ LÝ TÌM KIẾM PHIM THEO TÊN
// =========================================================================
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
                searchGrid.innerHTML = '<p style="color: #aaa; padding: 10px;">Không tìm thấy phim phù hợp.</p>';
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
    } catch (error) { console.error("Lỗi tìm kiếm:", error); }
}

// =========================================================================
// 🚪 KHỐI 4: HỆ THỐNG ĐĂNG NHẬP / ĐĂNG XUẤT SƠ KHỞI QUA PROMPT
// =========================================================================
function checkLoginStatus() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    if (loggedUser && loggedUser.token) {
        userProfile.innerHTML = `
            <div class="avatar" style="background:#e50914;">D</div>
            <div class="user-info">
                <span class="username">${loggedUser.username}</span>
                <span class="usertype">Thành viên VIP</span>
            </div>
            <span class="logout-btn" title="Đăng xuất" onclick="handleLogout(event)" style="margin-left: 10px; cursor: pointer;">🚪</span>
        `;
        userProfile.onclick = null;
    } else {
        userProfile.innerHTML = `
            <div class="avatar">?</div>
            <div class="user-info">
                <span class="username">Đăng nhập</span>
                <span class="usertype">Khách qua đường</span>
            </div>
        `;
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
                    alert("🎉 Đăng nhập thành công!");
                    window.location.reload();
                } else { alert(data.message); }
            });
        };
    }
}

function handleLogout(event) {
    event.stopPropagation();
    if (confirm("Duy có chắc chắn muốn đăng xuất tài khoản VIP không?")) {
        localStorage.removeItem('loggedUser');
        alert("👋 Đã đăng xuất thành công!");
        window.location.reload();
    }
}