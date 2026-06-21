const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// ÉP NHẬN DIỆN CỔNG ĐÁM MÂY TỰ ĐỘNG (ĐÃ SỬA: KHÔNG CÒN KHAI BÁO TRÙNG LẶP)
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// --- HỆ THỐNG XỬ LÝ ĐĂNG NHẬP (MỚI THÊM) ---
const MOCK_USER = {
    username: "TruongDuyVIP",
    password: "123"
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === MOCK_USER.username && password === MOCK_USER.password) {
        return res.json({
            success: true,
            username: MOCK_USER.username,
            usertype: "Tài khoản VIP",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DuyCineVIPToken"
        });
    } else {
        return res.json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu rồi Duy ơi!" });
    }
});

// Hàm helper kéo dữ liệu an toàn từ API v1
async function fetchMoviesFromV1Category(url) {
    try {
        const response = await axios.get(url, { timeout: 6000 });
        return response.data?.data?.items || response.data?.items || [];
    } catch (error) {
        console.error(`Lỗi kết nối API: ${url}`, error.message);
        return [];
    }
}

app.get('/api/movies', async (req, res) => {
    try {
        const [
            rawNew, 
            rawSingle, 
            rawSeries, 
            rawAnime, 
            rawChina, 
            rawKorea
        ] = await Promise.all([
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=1'),
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/danh-sach/phim-le?page=1'),
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/danh-sach/phim-bo?page=1'),
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1'),
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/quoc-gia/trung-quoc?page=1'),
            fetchMoviesFromV1Category('https://ophim1.com/v1/api/quoc-gia/han-quoc?page=1')
        ]);

        const formatMovie = (item) => {
            let img = item.thumb_url || '';
            if (img && !img.startsWith('http')) {
                img = `https://img.ophim.live/uploads/movies/${img}`;
            }
            return {
                id: item._id,
                title: item.name,
                slug: item.slug,
                label: `${item.quality || 'HD'} - ${item.lang || 'Vietsub'}`, 
                image_url: img
            };
        };

        res.json({
            newMovies: rawNew.slice(0, 10).map(formatMovie),
            phimTrungQuoc: rawChina.slice(0, 10).map(formatMovie),
            phimHanQuoc: rawKorea.slice(0, 10).map(formatMovie),
            phimHanhDong: rawSingle.slice(0, 10).map(formatMovie),
            anime: rawAnime.slice(0, 10).map(formatMovie),
            phimLe: rawSingle.slice(2, 12).map(formatMovie),
            phimBo: rawSeries.slice(0, 10).map(formatMovie)
        });

    } catch (err) {
        res.json({ newMovies: [], phimTrungQuoc: [], phimHanQuoc: [], phimHanhDong: [], anime: [], phimLe: [], phimBo: [] });
    }
});

app.get('/api/movie-detail', async (req, res) => {
    const slug = req.query.slug;
    try {
        const detailRes = await axios.get(`https://ophim1.com/phim/${slug}`, { timeout: 3000 });
        const detailData = detailRes.data;
        const episodesData = detailData.episodes[0]?.server_data || [];
        const episodes = episodesData.map(ep => ({ name: ep.name, link: ep.link_embed }));

        res.json({
            description: detailData.movie?.content?.replace(/<[^>]*>/g, '') || "Không có mô tả.",
            episodes: episodes
        });
    } catch (err) {
        res.json({ description: "Đang cập nhật nội dung...", episodes: [] });
    }
});

app.get('/api/search', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) return res.json([]);
    try {
        const searchResponse = await axios.get(`https://ophim1.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=12`, { timeout: 5000 });
        const items = searchResponse.data.data?.items || [];
        const pathImage = searchResponse.data.data?.seoOnPage?.pathImage || "https://img.ophim.live/uploads/movies/";
        
        res.json(items.map(item => ({
            id: item._id,
            title: item.name,
            slug: item.slug,
            label: `${item.quality || 'FHD'} - ${item.lang || 'Vietsub'}`,
            image_url: item.thumb_url.startsWith('http') ? item.thumb_url : `${pathImage}${item.thumb_url}`
        })));
    } catch (error) { res.json([]); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Máy chủ đồng bộ rạp phim chuẩn quốc gia đang chạy tại cổng: ${PORT}`);
});