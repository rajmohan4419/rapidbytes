import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

def crawl_web(seed_url):
    """
    Crawls a website starting from a seed URL.
    """
    # ---
    # We get the base URL to construct absolute URLs from relative ones.
    # ---
    base_url = f"{urlparse(seed_url).scheme}://{urlparse(seed_url).netloc}"

    # ---
    # We set up the robot parser to respect robots.txt.
    # ---
    robot_parser = RobotFileParser()
    robot_parser.set_url(urljoin(base_url, 'robots.txt'))
    robot_parser.read()

    # ---
    # We use a set to store the URLs we've already visited.
    # ---
    visited = set()
    # ---
    # We use a list as a queue to store the URLs we need to crawl.
    # We start with the seed URL.
    # ---
    queue = [seed_url]
    # ---
    # This list will store the data we extract.
    # ---
    data = []

    # ---
    # We continue crawling as long as there are URLs in the queue.
    # ---
    while queue:
        # ---
        # We get the next URL from the queue.
        # ---
        current_url = queue.pop(0)

        # ---
        # We check if we've already visited this URL.
        # ---
        if current_url in visited:
            continue

        # ---
        # We check if we are allowed to crawl this URL according to robots.txt.
        # ---
        if not robot_parser.can_fetch('*', current_url):
            print(f"Skipping (disallowed by robots.txt): {current_url}")
            continue

        # ---
        # We add the current URL to the set of visited URLs.
        # ---
        visited.add(current_url)
        print(f"Crawling: {current_url}")

        try:
            # ---
            # We fetch the HTML content of the page.
            # ---
            response = requests.get(current_url, timeout=5)
            # ---
            # We check if the request was successful.
            # ---
            response.raise_for_status()

            # ---
            # We parse the HTML content using BeautifulSoup.
            # ---
            soup = BeautifulSoup(response.text, 'html.parser')

            # ---
            # We extract the title of the page from the <title> tag.
            # For quotes.toscrape.com, the interesting data are the quotes themselves.
            # Let's extract the quotes and authors instead of just the title.
            # ---
            for quote in soup.find_all('div', class_='quote'):
                text = quote.find('span', class_='text').text
                author = quote.find('small', class_='author').text
                data.append({'quote': text, 'author': author})

            # ---
            # We find all the links on the page.
            # ---
            for link in soup.find_all('a', href=True):
                href = link['href']
                # ---
                # We construct the absolute URL for the link.
                # ---
                absolute_url = urljoin(base_url, href)
                # ---
                # We add the new URL to our queue to be crawled if it's within the same domain.
                # ---
                if absolute_url.startswith(base_url) and absolute_url not in visited:
                    queue.append(absolute_url)

            # ---
            # Politeness delay.
            # ---
            time.sleep(1)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching {current_url}: {e}")

    # ---
    # After crawling, we save the extracted data to a JSON file.
    # ---
    with open('data.json', 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    # ---
    # We start crawling from quotes.toscrape.com
    # ---
    seed_url = "http://quotes.toscrape.com/"
    crawl_web(seed_url)
    print("Crawling complete. Data saved to data.json")
