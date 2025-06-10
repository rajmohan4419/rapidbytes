document.addEventListener('DOMContentLoaded', () => {
    // EventRegistry API key
    const API_KEY = '7de5b262-507d-47bf-b589-fdca0a7ba4b8';
    const resultsContainer = document.getElementById('news-results');
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const term = searchInput.value.trim();
        const keywords = await getSuggestions(term);
        if (term && !keywords.includes(term)) {
            keywords.unshift(term);
        }
        fetchNews(keywords);
    });

    fetchNews();

    async function getSuggestions(prefix) {
        if (!prefix) {
            return [];
        }
        try {
            const url = `https://eventregistry.org/api/v1/suggestConceptsFast?prefix=${encodeURIComponent(prefix)}&lang=eng&apiKey=${API_KEY}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Failed suggestions');
            const data = await resp.json();
            if (Array.isArray(data)) {
                return data.map(c => c.label || c.title || c.id).filter(Boolean);
            } else if (data && data.concepts) {
                return data.concepts.map(c => c.label || c.title || c.id).filter(Boolean);
            } else if (data && data.suggestions) {
                return data.suggestions.map(c => c.label || c.title || c.id).filter(Boolean);
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
        return [];
    }

    function renderArticles(articles) {
        resultsContainer.innerHTML = '';
        if (!articles || articles.length === 0) {
            resultsContainer.textContent = 'No articles found.';
            return;
        }
        const list = document.createElement('ul');
        articles.forEach(article => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = article.url;
            link.textContent = article.title || 'Untitled';
            link.target = '_blank';
            item.appendChild(link);
            if (article.body) {
                const preview = document.createElement('p');
                const snippet = article.body.slice(0, 100);
                preview.textContent = snippet + (article.body.length > 100 ? '...' : '');
                item.appendChild(preview);
            }
            list.appendChild(item);
        });
        resultsContainer.appendChild(list);
    }

    function buildQuery(term) {
        const today = new Date().toISOString().slice(0, 10);
        if (term) {
            return {
                "$query": {
                    "$and": [
                        { "keyword": term, "keywordLoc": "title" },
                        { "keyword": term, "keywordLoc": "body" },
                        { "dateStart": today, "dateEnd": today }
                    ]
                }
            };
        }
        return { "$query": { "dateStart": today, "dateEnd": today } };
    }

    function fetchNews(term = '') {
        const queryObj = buildQuery(term);
        const query = encodeURIComponent(JSON.stringify(queryObj));
        let url = `https://eventregistry.org/api/v1/article/getArticles?query=${query}&resultType=articles&articlesSortBy=date&includeArticleSocialScore=true&includeArticleConcepts=true&includeArticleCategories=true&includeArticleLocation=true&includeArticleImage=true&includeArticleVideos=true&includeArticleLinks=true&includeArticleExtractedDates=true&includeArticleDuplicateList=true&includeArticleOriginalArticle=true&apiKey=${API_KEY}`;
        fetch(url)
            .then(resp => {
                if (!resp.ok) {
                    throw new Error('Network response was not ok');
                }
                return resp.json();
            })
            .then(data => {
                const articles = (data.articles && data.articles.results) ? data.articles.results : [];
                renderArticles(articles);
            })
            .catch(err => {
                console.error('Error fetching news:', err);
                resultsContainer.textContent = 'Error loading news.';
            });
        }
        return { "$query": { "$and": conditions } };
    }

    async function fetchNews(keywords = []) {
        const queryObj = buildQuery(keywords);
        const query = encodeURIComponent(JSON.stringify(queryObj));
        const url = `https://eventregistry.org/api/v1/article/getArticles?query=${query}&resultType=articles&articlesSortBy=date&includeArticleSocialScore=true&includeArticleConcepts=true&includeArticleCategories=true&includeArticleLocation=true&includeArticleImage=true&includeArticleVideos=true&includeArticleLinks=true&includeArticleExtractedDates=true&includeArticleDuplicateList=true&includeArticleOriginalArticle=true&apiKey=${API_KEY}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Network response was not ok');
            const data = await resp.json();
            const articles = (data.articles && data.articles.results) ? data.articles.results : [];
            renderArticles(articles);
        } catch (err) {
            console.error('Error fetching news:', err);
            resultsContainer.textContent = 'Error loading news.';
        }
    }

});
