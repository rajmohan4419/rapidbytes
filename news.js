document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('news-sources');
    if (!container) return;

    fetch('https://newsapi.org/v2/top-headlines/sources?apiKey=6d54bd8f20ee40cb8c3b119cf16ae2c1')
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data.sources)) {
                const list = document.createElement('ul');
                data.sources.forEach(src => {
                    const item = document.createElement('li');
                    item.textContent = src.name;
                    list.appendChild(item);
                });
                container.textContent = '';
                container.appendChild(list);
            } else {
                container.textContent = 'No sources found.';
            }
        })
        .catch(err => {
            console.error('Error fetching news sources:', err);
            container.textContent = 'Error loading news sources.';
        });
});
