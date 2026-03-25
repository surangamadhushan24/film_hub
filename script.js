/* ==========================================
   FILMHUB APPLICATION - JAVASCRIPT
   ========================================== */

const app = {
    // TMDb API Configuration
    // IMPORTANT: do not hardcode secrets here in production.
    // For local development, set your key in `.env` and use a build tool to inject as `process.env.TMDB_API_KEY`.
    API_KEY: 'YOUR_API_KEY_HERE', // replace with your own key in local copy only
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_URL: 'https://image.tmdb.org/t/p/w500',
    BACKDROP_URL: 'https://image.tmdb.org/t/p/original',
    
    state: {
        trending: [],
        popular: [],
        topRated: [],
        upcoming: [],
        featured: null,
        searchQuery: '',
        theme: 'dark'
    },

    // Initialize App
    init() {
        this.setupEventListeners();
        this.loadAllData();
        this.checkTheme();
    },

    // Event Listeners
    setupEventListeners() {
        // Search functionality with debouncing
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.trim()) {
                    this.performSearch(e.target.value.trim());
                } else {
                    this.goHome();
                }
            }, 500);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value.trim());
            }
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    },

    // API Fetch Helper
    async fetchData(endpoint) {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const url = `${this.BASE_URL}${endpoint}${separator}api_key=${this.API_KEY}&language=en-US`;

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok (status ${response.status})`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return this.getFallbackData(endpoint);
        }
    },

    // Load all movie data in parallel
    async loadAllData() {
        const [trending, popular, topRated, upcoming] = await Promise.all([
            this.fetchData('/trending/movie/week'),
            this.fetchData('/movie/popular'),
            this.fetchData('/movie/top_rated'),
            this.fetchData('/movie/upcoming')
        ]);

        this.state.trending = trending.results || [];
        this.state.popular = popular.results || [];
        this.state.topRated = topRated.results || [];
        this.state.upcoming = upcoming.results || [];

        // Set featured movie (first trending)
        if (this.state.trending.length > 0) {
            this.state.featured = this.state.trending[0];
            this.updateHero(this.state.featured);
        }

        // Render all sections
        this.renderSection('trending', this.state.trending);
        this.renderSection('popular', this.state.popular);
        this.renderSection('topRated', this.state.topRated);
        this.renderSection('upcoming', this.state.upcoming);
    },

    // Update Hero Section with featured movie
    updateHero(movie) {
        this.featuredMovie = movie;
        const hero = document.getElementById('hero');
        const title = document.getElementById('heroTitle');
        const rating = document.getElementById('heroRating');
        const year = document.getElementById('heroYear');
        const genre = document.getElementById('heroGenre');
        const overview = document.getElementById('heroOverview');

        hero.style.backgroundImage = `url(${this.BACKDROP_URL}${movie.backdrop_path})`;
        title.textContent = movie.title;
        rating.innerHTML = `<i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}`;
        year.textContent = movie.release_date?.split('-')[0] || 'N/A';
        genre.textContent = this.getGenreName(movie.genre_ids?.[0]);
        overview.textContent = movie.overview;
    },

    // Render Movie Section
    renderSection(sectionId, movies) {
        const container = document.getElementById(`${sectionId}Container`);
        container.innerHTML = '';

        movies.slice(0, 10).forEach(movie => {
            const card = this.createMovieCard(movie);
            container.appendChild(card);
        });
    },

    // Create Movie Card HTML
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => this.showDetails(movie.id);

        const posterPath = movie.poster_path 
            ? `${this.IMAGE_URL}${movie.poster_path}`
            : 'https://via.placeholder.com/200x300/2a2a2a/666?text=No+Image';

        card.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.release_date?.split('-')[0] || 'N/A'}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i> ${movie.vote_average?.toFixed(1) || '0.0'}
                    </span>
                </div>
                <p class="movie-description">${movie.overview || 'No description available.'}</p>
            </div>
        `;

        return card;
    },

    // Show Movie Details Modal
    async showDetails(movieId) {
        const movie = await this.fetchData(`/movie/${movieId}`);
        
        document.getElementById('modalHero').style.backgroundImage = 
            `url(${this.BACKDROP_URL}${movie.backdrop_path || ''})`;
        document.getElementById('modalPoster').src = 
            movie.poster_path ? `${this.IMAGE_URL}${movie.poster_path}` : '';
        document.getElementById('modalTitle').textContent = movie.title || 'Unknown Title';
        document.getElementById('modalRating').textContent = movie.vote_average !== undefined
            ? Number(movie.vote_average).toFixed(1)
            : 'N/A';
        document.getElementById('modalDate').textContent = movie.release_date || 'N/A';
        document.getElementById('modalRuntime').textContent = 
            `${movie.runtime !== undefined ? movie.runtime : '--'} min`;
        document.getElementById('modalGenre').textContent = 
            movie.genres?.map(g => g.name).join(', ') || 'N/A';
        document.getElementById('modalOverview').textContent = movie.overview || 'No overview available.';

        const modal = document.getElementById('movieModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // Close Modal
    closeModal(event) {
        if (!event || event.target.id === 'movieModal' || event.target.closest('.modal-close')) {
            document.getElementById('movieModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Search Functionality
    async performSearch(query) {
        if (!query) return;

        this.state.searchQuery = query;
        const data = await this.fetchData(`/search/movie?query=${encodeURIComponent(query)}`);
        
        // Hide main content, show results
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('footer').classList.add('hidden');
        const resultsView = document.getElementById('searchResults');
        resultsView.classList.remove('hidden');

        document.getElementById('searchQuery').textContent = query;
        document.getElementById('searchCount').textContent = `Found ${data.results?.length || 0} movies`;

        const grid = document.getElementById('searchGrid');
        grid.innerHTML = '';

        if (data.results && data.results.length > 0) {
            document.getElementById('noResults').classList.add('hidden');
            data.results.forEach(movie => {
                grid.appendChild(this.createMovieCard(movie));
            });
        } else {
            document.getElementById('noResults').classList.remove('hidden');
        }

        // Close search input on mobile
        document.getElementById('searchContainer').classList.remove('active');
    },

    // Search by Genre
    async searchByGenre(genreId) {
        const data = await this.fetchData(`/discover/movie?with_genres=${genreId}`);
        this.renderSearchResults(data.results, this.getGenreName(genreId));
    },

    // View All (Category)
    async viewAll(category) {
        let endpoint;
        let label;

        switch (category) {
            case 'trending':
                endpoint = '/trending/movie/week';
                label = 'Trending';
                break;
            case 'popular':
            case 'top_rated':
            case 'upcoming':
                endpoint = `/movie/${category}`;
                label = category.replace('_', ' ').toUpperCase();
                break;
            default:
                endpoint = `/movie/${category}`;
                label = category.replace('_', ' ').toUpperCase();
                break;
        }

        const data = await this.fetchData(endpoint);
        this.renderSearchResults(data.results || [], label);
    },

    // Helper: Render Search Results Grid
    renderSearchResults(movies, title) {
        movies = Array.isArray(movies) ? movies : [];

        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('footer').classList.add('hidden');
        const resultsView = document.getElementById('searchResults');
        resultsView.classList.remove('hidden');

        document.getElementById('searchQuery').textContent = title;
        document.getElementById('searchCount').textContent = `${movies.length} movies`;

        const grid = document.getElementById('searchGrid');
        grid.innerHTML = '';
        movies.forEach(movie => {
            grid.appendChild(this.createMovieCard(movie));
        });
        document.getElementById('noResults').classList.add('hidden');
    },

    // Navigation
    goHome() {
        document.getElementById('searchResults').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('footer').classList.remove('hidden');
        document.getElementById('searchInput').value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // UI Interactions
    toggleSearch() {
        const container = document.getElementById('searchContainer');
        const input = document.getElementById('searchInput');
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            input.focus();
        }
    },

    toggleMobileMenu() {
        document.getElementById('mobileMenu').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    },

    toggleTheme() {
        const body = document.body;
        const icon = document.getElementById('themeIcon');
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', newTheme);
    },

    checkTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('themeIcon').className = 
            savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },

    // Slider Navigation
    slide(section, direction) {
        const container = document.getElementById(`${section}Container`);
        const scrollAmount = 220;
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    },

    playFeatured() {
        alert(`Playing: ${this.featuredMovie?.title}\n\nIn a real app, this would start video playback!`);
    },

    // Genre Helper
    getGenreName(id) {
        const genres = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
            53: 'Thriller', 10752: 'War', 37: 'Western'
        };
        return genres[id] || 'Movie';
    },

    // Fallback data if API fails
    getFallbackData(endpoint) {
        if (endpoint && endpoint.startsWith('/movie/')) {
            return {
                id: 0,
                title: "Inception",
                vote_average: 8.8,
                release_date: "2010-07-16",
                runtime: 148,
                poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                genres: [{ id: 28, name: 'Action'}, { id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }]
            };
        }

        return {
            results: [
                {
                    id: 1,
                    title: "Inception",
                    vote_average: 8.8,
                    release_date: "2010-07-16",
                    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                    backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                    genre_ids: [28, 878, 12]
                },
                {
                    id: 2,
                    title: "The Dark Knight",
                    vote_average: 9.0,
                    release_date: "2008-07-18",
                    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                    backdrop_path: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
                    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                    genre_ids: [28, 80, 18]
                },
                {
                    id: 3,
                    title: "Interstellar",
                    vote_average: 8.6,
                    release_date: "2014-11-07",
                    poster_path: "/gEU2QniL6E86tGoD1M8DMkfyG6v.jpg",
                    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
                    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                    genre_ids: [12, 18, 878]
                }
            ]
        };
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});