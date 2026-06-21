let hotMoviesList = [];       
let currentHeroIndex = 0;     
let allMoviesCachedData = null; // Bộ nhớ đệm lưu trữ dữ liệu phim tổng hợp
let horrorMoviesCachedData = []; // Bộ nhớ đệm lưu phim kinh dị

document.addEventListener("DOMContentLoaded", async () => {
    checkLoginStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        const logo = document.querySelector('.logo, .logo-group span');
        if (logo) { logo.style.color = '#ffffff'; logo.style.textDecoration = 'none'; }
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

async function loadMoviesFromServer() {
    try {
        const response = await fetch('https://cinematic-3gsh.onrender.com/api/movies');
        const data = await response.json();
        allMoviesCachedData = data; // Lưu trữ vào bộ nhớ đệm

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

        // Tải danh mục kinh dị
        try {
            const horrorRes = await fetch('https://ophim1.com/v1/api/the-loai/kinh-di?page=1');
            const horrorData = await horrorRes.json();
            horrorMoviesCachedData = (horrorData.data?.items || []).map(item => {
                let img = item.thumb_url;
                if (!img.startsWith('http')) img = `https://img.ophim.live/uploads/movies/${img}`;
                return { title: item.name, slug: item.slug, image_url: img };
            });
            renderMovieSection('horrorMovieGrid', horrorMoviesCachedData.slice(0, 10));
        } catch (e) { console.log("Lỗi tải mục kinh dị:", e); }

    } catch (error) { console.error(error); }
}

// --- LOGIC XỬ LÝ BẤM "XEM TẤT CẢ" HIỂN THỊ LOẠT PHIM BẠT NGÀN ---
function viewAllCategory(categoryKey) {
    const searchSection = document.getElementById('searchResultSection');
    const searchGrid = document.getElementById('searchMoviesGrid');
    const searchTitle = document.getElementById('searchResultTitle');

    if (!searchSection || !searchGrid || !searchTitle) return;

    let moviesToRender = [];
    let titleText = "";

    // Trích xuất dữ liệu loạt phim tương ứng theo danh mục đã bấm
    if (categoryKey === 'horror') {
        moviesToRender = horrorMoviesCachedData;
        titleText = "☠️ Toàn Bộ Loạt Phim Kinh Dị";
    } else if (allMoviesCachedData) {
        switch (categoryKey) {
            case 'newMovies':
                moviesToRender = allMoviesCachedData.newMovies;
                titleText = "🔥 Toàn Bộ Phim Mới Cập Nhật";
                break;
            case 'phimTrungQuoc':
                moviesToRender = allMoviesCachedData.phimTrungQuoc;
                titleText = "🇨🇳 Toàn Bộ Phim Trung Quốc Quốc Dân";
                break;
            case 'phimHanQuoc':
                moviesToRender = allMoviesCachedData.phimHanQuoc;
                titleText = "🇰🇷 Toàn Bộ Loạt Phim Hàn Quốc Lãng Mạn";
                break;
            case 'phimBo':
                moviesToRender = allMoviesCachedData.phimBo;
                titleText = "🎬 Toàn Bộ Danh Sách Phim Bộ Dài Tập";
                break;
            case 'phimLe':
                moviesToRender = allMoviesCachedData.phimLe;
                titleText = "🎥 Toàn Bộ Kho Phim Lẻ Chọn Lọc";
                break;
            case 'anime':
                moviesToRender = allMoviesCachedData.anime;
                titleText = "⛩️ Toàn Bộ Thế Giới Phim Hoạt Hình Anime";
                break;
        }
    }

    // Đổ danh sách loạt phim đầy đủ lên khối hiển thị
    searchTitle.innerText = titleText;
    searchSection.style.display = 'block';
    searchGrid.innerHTML = '';

    moviesToRender.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => window.location.href = `detail.html?slug=${movie.slug}`;
        card.innerHTML = `
            <div class="movie-img-container"><img src="${movie.image_url}" alt="${movie.title}"></div>
            <div class="movie-title">${movie.title}</div>
        `;
        searchGrid.appendChild(card);
    });

    // Cuộn mượt màn hình lên vùng xem danh sách phim
    searchSection.scrollIntoView({ behavior: 'smooth' });
}

// Hàm đóng cụm loạt phim khi xem xong
function closeViewAllSection() {
    const searchSection = document.getElementById('searchResultSection');
    if (searchSection) searchSection.style.display = 'none';
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
    const searchTitle = document.getElementById('searchResultTitle');

    if (!input) {
        if (searchSection) searchSection.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://cinematic-3gsh.onrender.com/api/search?keyword=${encodeURIComponent(input)}`);
        const movies = await response.json();

        if (searchSection && searchGrid) {
            if (searchTitle) searchTitle.innerText = "🔍 Kết Quả Tìm Kiếm Phim";
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