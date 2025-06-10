document.addEventListener('DOMContentLoaded', () => {
    // EventRegistry API key
    const API_KEY = '7de5b262-507d-47bf-b589-fdca0a7ba4b8';
    const resultsContainer = document.getElementById('news-results');
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');

    form.addEventListener('submit', e => {
        e.preventDefault();
        fetchNews(searchInput.value.trim());
    });

    fetchNews();

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

});
