// Fetch and display news articles
// Uses EventRegistry suggestConceptsFast API to retrieve concept URI from user query
// Then queries articles by concept URI for today's date

document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = '7de5b262-507d-47bf-b589-fdca0a7ba4b8';
    const resultsContainer = document.getElementById('news-results');
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const term = searchInput.value.trim();
        const uri = await getConceptUri(term);
        fetchNews(uri);
    });

    // Load today's news on page load
    fetchNews();

    async function getConceptUri(term) {
        if (!term) return null;
        const url = `https://eventregistry.org/api/v1/suggestConceptsFast?prefix=${encodeURIComponent(term)}&lang=eng&apiKey=${API_KEY}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Failed suggestions');
            const data = await resp.json();
            const suggestion = Array.isArray(data)
                ? data[0]
                : (data && data.concepts ? data.concepts[0] : (data && data.suggestions ? data.suggestions[0] : null));
            return suggestion && suggestion.uri ? suggestion.uri : null;
        } catch (err) {
            console.error('Error fetching concept URI:', err);
            return null;
        }
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
            if (article.image) {
                const img = document.createElement('img');
                img.src = article.image;
                item.appendChild(img);
            }
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

    function buildQuery(uri) {
        const dateStart = document.getElementById('date-start').value;
        const dateEnd = document.getElementById('date-end').value;
        const conditions = [];
        if (dateStart && dateEnd) {
            conditions.push({ dateStart: dateStart, dateEnd: dateEnd });
        } else {
            const today = new Date().toISOString().slice(0, 10);
            conditions.push({ dateStart: today, dateEnd: today });
        }
        if (uri) {
            conditions.push({ conceptUri: uri });
        }
        return { "$query": { "$and": conditions } };
    }

    async function fetchNews(uri = null) {
        const queryObj = buildQuery(uri);
        const query = encodeURIComponent(JSON.stringify(queryObj));
        const url = `https://eventregistry.org/api/v1/article/getArticles?query=${query}&resultType=articles&articlesSortBy=date&includeArticleSocialScore=true&includeArticleConcepts=true&includeArticleCategories=true&includeArticleLocation=true&includeArticleImage=true&includeArticleVideos=true&includeArticleLinks=true&includeArticleExtractedDates=true&includeArticleDuplicateList=true&includeArticleOriginalArticle=true&apiKey=${API_KEY}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Network response was not ok');
            const data = await resp.json();
            const articles = data.articles && data.articles.results ? data.articles.results : [];
            renderArticles(articles);
        } catch (err) {
            console.error('Error fetching news:', err);
            resultsContainer.textContent = 'Error loading news.';
        }
    }
});
