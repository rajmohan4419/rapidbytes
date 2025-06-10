document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = '6d54bd8f20ee40cb8c3b119cf16ae2c1';
    const resultsContainer = document.getElementById('news-results');
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

    function fetchNews() {
        let url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEY}`;
        fetch(url)
            .then(resp => {
                if (!resp.ok) {
                    throw new Error('Network response was not ok');
                }
                return resp.json();
            })
            .then(data => {
                renderArticles(data.articles || []);
            })
            .catch(err => {
                console.error('Error fetching news:', err);
                resultsContainer.textContent = 'Error loading news.';
            });
    }

});
