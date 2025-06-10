document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('news-sources');
    if (!container) return;

    fetch('https://stock.indianapi.in/news', {
        headers: {
            'X-Api-Key': 'sk-live-v9EQtCmJTVidXufJhqcaRzmUUYw2rKkQjqvGJcfb'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const articles = Array.isArray(data)
                ? data
                : (data.data || data.articles || data.news || data.results || []);
        .then(response => response.json())
        .then(data => {
            const articles = data.data || data.articles || data.news || [];
            if (Array.isArray(articles)) {
                const list = document.createElement('ul');
                articles.forEach(article => {
                    const item = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = article.url || article.link || '#';
                    link.textContent = article.title || article.name || 'Untitled';
                    link.target = '_blank';
                    item.appendChild(link);
                    list.appendChild(item);
                });
                container.textContent = '';
                container.appendChild(list);
            } else {
                container.textContent = 'No headlines found.';
            }
        })
        .catch(err => {
            console.error('Error fetching news:', err);
            container.textContent = 'Error loading news.';
        });
});
