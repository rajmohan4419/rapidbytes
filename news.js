document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('news-sources');
    if (!container) return;

    fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=6d54bd8f20ee40cb8c3b119cf16ae2c1')
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data.articles)) {
                const list = document.createElement('ul');
                data.articles.forEach(article => {
                    const item = document.createElement('li');
                    item.textContent = article.title;
                    list.appendChild(item);
                });
                container.textContent = '';
                container.appendChild(list);
            } else {
                container.textContent = 'No headlines found.';
            }
        })
        .catch(err => {
            console.error('Error fetching headlines:', err);
            container.textContent = 'Error loading headlines.';
        });
});
