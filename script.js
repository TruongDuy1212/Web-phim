let hotMoviesList = [];       
let currentHeroIndex = 0;     

document.addEventListener("DOMContentLoaded", async () => {
    checkLoginStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const movieSlug = urlParams.get('slug');

    if (movieSlug) {
        // Fix logo trắng bên trang detail
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

// CẬP NHẬT BANNER LỚN FULL NỀN ĐÈ CHỮ LÊN ẢNH
async function updateHeroBanner(index) {
    const heroBanner = document.getElementById('heroBanner');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroPlayBtn = document.getElementById('heroPlayBtn');

    if (hotMoviesList.length > 0 && heroBanner) {
        const movie = hotMoviesList[index];
        
        // Gán trực tiếp ảnh phim làm hình nền Full khổ lớn
        heroBanner.style.backgroundImage = `url(${movie.image_url})`;
        if (heroTitle) heroTitle.innerText = movie.title;
        
        // Khai thác mô tả phim từ API để hiển thị chi tiết
        try {
            const rawRes = await fetch(`https://ophim1.com/phim/${movie.slug}`);
            const rawData = await rawRes.json();
            if (heroDesc && rawData.movie) {
                heroDesc.innerText = rawData.movie.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';
            }
        } catch (e) {
            if (heroDesc) heroDesc.innerText = `Theo dõi ngay bộ phim hot ${movie.title} chất lượng Full HD vietsub mượt mà nhất tại Cine NC.`;
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
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    if (loggedUser && loggedUser.token) {
        const avatarNode = userProfile.querySelector('.avatar');
        const usernameNode = userProfile.querySelector('.username');
        if (avatarNode) avatarNode.innerText = 'D';
        if (usernameNode) usernameNode.innerText = loggedUser.username;
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
                    alert("🎉 Đăng nhập thành công!");
                    window.location.reload();
                } else { alert(data.message); }
            });
        };
    }
}