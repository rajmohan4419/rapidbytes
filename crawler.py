import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
from collections import deque
from datetime import datetime, timedelta

def scrape_page(url, config):
    """
    Scrapes a single page, extracts data and new links.
    Returns a tuple of (list_of_data, list_of_new_urls).
    """
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}", flush=True)
        return [], []

    soup = BeautifulSoup(response.text, 'html.parser')

    data = []
    rules = config['scraping_rules']
    for item in soup.select(rules['quote_container']):
        text_element = item.select_one(rules['quote_text'])
        text = text_element.get_text(strip=True) if text_element else "No text found"

        author_element = item.select_one(rules['author_text'])
        author = author_element.get_text(strip=True) if author_element else "No author found"

        data.append({'quote': text, 'author': author, 'source': config['name']})

    new_urls = []
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    for link in soup.find_all('a', href=True):
        href = link['href']
        absolute_url = urljoin(base_url, href)
        if absolute_url.startswith(base_url):
            new_urls.append(absolute_url)

    return data, new_urls

def crawl_site(config):
    """
    Crawls a website based on a configuration dictionary.
    Manages the queue of URLs to visit for a single site.
    """
    robot_parser = RobotFileParser()
    if not config.get('seed_urls'):
        print(f"No seed URLs for {config.get('name')}", flush=True)
        return []
    base_url = f"{urlparse(config['seed_urls'][0]).scheme}://{urlparse(config['seed_urls'][0]).netloc}"
    robot_parser.set_url(urljoin(base_url, 'robots.txt'))
    robot_parser.read()

    queue = deque(config['seed_urls'])
    visited = set(config['seed_urls'])
    all_site_data = []

    while queue:
        current_url = queue.popleft()

        if not robot_parser.can_fetch('*', current_url):
            print(f"Skipping (disallowed by robots.txt): {current_url}", flush=True)
            continue

        print(f"Crawling: {current_url}", flush=True)

        data, new_urls = scrape_page(current_url, config)
        all_site_data.extend(data)

        for url in new_urls:
            if url not in visited:
                visited.add(url)
                queue.append(url)

        time.sleep(config.get('crawl_delay', 1))

    return all_site_data


if __name__ == "__main__":
    with open('config.json', 'r') as f:
        configs = json.load(f)

    for config in configs:
        config['last_crawled'] = datetime.min

    while True:
        print(f"\n--- Scheduler checking at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---", flush=True)

        task_queue = deque()

        for config in configs:
            schedule_minutes = config.get('schedule_minutes', 60)
            if datetime.now() - config['last_crawled'] > timedelta(minutes=schedule_minutes):
                print(f"Scheduling '{config['name']}' for crawling.", flush=True)
                task_queue.append(config)
                config['last_crawled'] = datetime.now()

        if not task_queue:
            print("No sites are due for crawling.", flush=True)

        all_data = []
        while task_queue:
            config = task_queue.popleft()

            print(f"--- Starting crawl for {config['name']} ---", flush=True)
            site_data = crawl_site(config)
            if site_data:
                all_data.extend(site_data)
            print(f"--- Finished crawl for {config['name']} ---", flush=True)

        if all_data:
            with open('data.json', 'w') as f:
                json.dump(all_data, f, indent=4)
            print("Crawling complete. Data saved to data.json", flush=True)

        print("\n--- Scheduler sleeping for 60 seconds ---", flush=True)
        time.sleep(60)
