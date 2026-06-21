// --- BIẾN TOÀN CỤC THEO DÕI BANNER & PHIM ---
let hotMoviesList = [];       
let currentHeroIndex = 0;     
let heroAutoplayTimer = null; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra tài khoản người dùng ngay khi vào web
    checkLoginStatus();

    // 2. SỬA LOGO XANH: Xóa màu xanh gạch chân của logo ở tất cả các trang
    const logoElements = document.querySelectorAll('.logo, a[href*="index.html"]');
    logoElements.forEach(logo => {
        logo.style.color = '#ffffff';
        logo.style.textDecoration = 'none';
    });

    // 3. KIỂM TRA XEM ĐANG Ở TRANG CHỦ HAY TRANG CHI TIẾT ĐỂ CHẠY LOGIC
    // Thử lấy tham số slug trên thanh địa chỉ URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        // --- NẾU CÓ SLUG $\rightarrow$ ĐANG Ở TRANG XEM PHIM DETAIL.HTML ---
        await loadMovieDetailFromServer(movieSlug);
    } else {
        // --- NẾU KHÔNG CÓ SLUG $\rightarrow$ ĐANG Ở TRANG CHỦ INDEX.HTML ---
        await loadMoviesFromServer();

        // Lắng nghe ô tìm kiếm (chỉ hoạt động ở trang chủ)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await handleSearch();
                }
            });
        }
    }
});

// =========================================================================
// 🌐 KHỐI 1: XỬ LÝ LOGIC TRANG CHI TIẾT XEM PHIM (FIX LỖI LOADING / MẤT TẬP PHIM)
// =========================================================================
async function loadMovieDetailFromServer(slug) {
    try {
        // Gọi API Render để bốc nội dung tóm tắt phim
        const response = await fetch(`https://cinematic-3gsh.onrender.com/api/movie-detail?slug=${slug}`);
        const data = await response.json();

        // 1. Đổ nội dung tóm tắt phim vào giao diện của Duy
        const descElement = document.getElementById('modal-desc') || document.querySelector('.content-text') || document.querySelector('.introduction-box p') || document.getElementById('movieDesc');
        if (descElement) {
            descElement.innerText = data.description || "Đang cập nhật nội dung tóm tắt...";
        }

        // 2. Đổ danh sách nút bấm tập phim ra để click xem
        const epListContainer = document.getElementById('episode-list') || document.querySelector('.choose-episode-grid') || document.getElementById('episodeContainer') || document.querySelector('.episode-grid');
        if (epListContainer) {
            epListContainer.innerHTML = '';
            
            if (!data.episodes || data.episodes.length === 0) {
                epListContainer.innerHTML = '<p style="color:#aaa; padding:10px;">Phim đang được cập nhật tập mới, Duy quay lại sau nhé!</p>';
            } else {
                data.episodes.forEach(ep => {
                    const btn = document.createElement('button');
                    btn.className = 'ep-btn';
                    // Tạo style đẹp cho nút bấm tập phim
                    btn.style = "padding: 10px 18px; background: #1f1f22; color: #fff; border: 1px solid #333; border-radius: 4px; margin: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;";
                    btn.innerText = ep.name;
                    
                    // Thêm hiệu ứng hover đổi màu nút tập phim bằng code
                    btn.onmouseover = () => btn.style.background = '#e50914';
                    btn.onmouseout = () => btn.style.background = '#1f1f22';

                    // Khi Duy click vào tập phim, iframe trình phát video sẽ chạy link phim mượt mà
                    btn.onclick = () => {
                        let player = document.getElementById('video-iframe') || document.getElementById('player') || document.querySelector('iframe');
                        let playerSection = document.getElementById('video-player-section') || document.querySelector('.player-container') || document.querySelector('.video-box');
                        
                        if (player) {
                            player.src = ep.link;
                            if (playerSection) playerSection.style.display = 'block';
                            player.scrollIntoView({ behavior: 'smooth' }); // Tự cuộn màn hình lên khung video
                        } else {
                            // Nếu không tìm thấy thẻ iframe, mở tab mới xem luôn
                            window.open(ep.link, '_blank');
                        }
                    };
                    epListContainer.appendChild(btn);
                });
            }
        }

        // 3. ÉP LẤY POSTER VÀ TÊN PHIM THẬT TỪ API GỐC (QUÉT SẠCH CHỮ LOADING...)
        const posterImg = document.getElementById('modal-img') || document.querySelector('.poster-main-img') || document.querySelector('.poster img') || document.querySelector('.movie-thumb img');
        const titleElement = document.getElementById('modal-title') || document.querySelector('.movie-detail-info h1') || document.querySelector('.title-detail') || document.querySelector('.movie-info h1');
        
        const rawRes = await fetch(`https://ophim1.com/phim/${slug}`);
        const rawData = await rawRes.json();
        
        if (rawData.movie) {
            // Đổi chữ Loading... thành tên phim thật
            if (titleElement) titleElement.innerText = rawData.movie.name;
            
            // Đổi ảnh lỗi thành ảnh poster thật
            if (posterImg) {
                let imgUrl = rawData.movie.thumb_url;
                if (!imgUrl.startsWith('http')) imgUrl = `https://img.ophim.live/uploads/movies/${imgUrl}`;
                posterImg.src = imgUrl;
                posterImg.alt = rawData.movie.name;
            }

            // Thay thế động các thông số số tập, ngôn ngữ bị kẹt chữ "Đang tải" trên giao diện
            document.body.innerHTML = document.body.innerHTML
                .replace('Đang tải...', rawData.movie.episode_current || 'Full HD')
                .replace('Loading...', rawData.movie.name);
        }

    } catch (error) {
        console.error("Lỗi xử lý trang chi tiết phim:", error);
    }
}

// =========================================================================
// 🌐 KHỐI 2: XỬ LÝ ĐỔ DỮ LIỆU PHIM LÊN TRANG CHỦ INDEX.HTML
// =========================================================================
async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();

        // Đổ phim vào đúng các ID hàng phim gốc của Duy
        renderMovieSection('newMoviesGrid', data.newMovies);
        renderMovieSection('phimTrungQuocGrid', data.phimTrungQuoc);
        renderMovieSection('phimHanQuocGrid', data.phimHanQuoc);
        renderMovieSection('phimBoGrid', data.phimBo);
        renderMovieSection('phimLeGrid', data.phimLe);
        renderMovieSection('animeGrid', data.anime);

        // Bốc riêng danh mục Kinh Dị cho phong phú
        try {
            const horrorRes = await fetch('https://ophim1.com/v1/api/the-loai/kinh-di?page=1');
            const horrorData = await horrorRes.json();
            const horrorItems = horrorData.data?.items || [];
            const horrorMovies = horrorItems.slice(0, 10).map(item => {
                let img = item.thumb_url;
                if (!img.startsWith('http')) img = `https://img.ophim.live/uploads/movies/${img}`;
                return { title: item.name, slug: item.slug, image_url: img };
            });
            renderMovieSection('horrorMovieGrid', horrorMovies);
        } catch (e) { console.log(e); }

    } catch (error) {
        console.error("Lỗi khi kết nối đến máy chủ Render trang chủ:", error);
    }
}

function renderMovieSection(elementId, movies) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    grid.innerHTML = '';

    if (!movies || movies.length === 0) {
        grid.innerHTML = '<p style="color: #555; padding: 10px;">Đang tải danh mục phim...</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        // Khi click vào phim, chuyển hướng kèm tham số ?slug= để trang sau bắt dữ liệu
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
                searchGrid.innerHTML = '<p style="color: #aaa; padding: 10px;">Không tìm thấy phim phù hợp với từ khóa.</p>';
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
// 🚪 KHỐI 4: HỆ THỐNG ĐĂNG NHẬP / ĐĂNG KÝ POPUP 
// =========================================================================
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
            <span class="logout-btn" title="Đăng xuất tài khoản" onclick="handleLogout(event)" style="margin-left: 10px; font-size: 14px; cursor:pointer;">🚪</span>
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
        userProfile.onclick = () => openAuthModal('login');
    }
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
        title.innerText = "Đăng Nhập Hệ Thống";
        btn.innerText = "ĐĂNG NHẬP INTERNET";
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
    
    if (!username || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

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
                checkLoginStatus();
            } else {
                alert(data.message);
            }
        });
    } else {
        let localUsers = JSON.parse(localStorage.getItem('registeredUsersList')) || [];
        if (localUsers.some(u => u.username === username) || username === "TruongDuyVIP") {
            alert("Tên tài khoản này đã tồn tại, vui lòng chọn tên khác!");
            return;
        }
        localUsers.push({ username, password });
        localStorage.setItem('registeredUsersList', JSON.stringify(localUsers));
        alert("🎉 Đăng ký thành công! Hãy đăng nhập Duy nhé.");
        openAuthModal('login');
    }
}

function handleLogout(event) {
    event.stopPropagation();
    if (confirm("Duy có chắc chắn muốn đăng xuất không?")) {
        localStorage.removeItem('loggedUser');
        alert("👋 Đã đăng xuất thành công!");
        window.location.reload();
    }
}