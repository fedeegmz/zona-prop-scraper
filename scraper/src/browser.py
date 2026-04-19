from typing import Any

import cloudscraper


class Browser:
    def __init__(self) -> None:
        self.scraper = cloudscraper.create_scraper()

    def get(self, url: str):
        return self.scraper.get(url)

    def post(self, url: str, data: Any):
        return self.scraper.post(url, data)

    def get_text(self, url: str) -> str:
        return self.scraper.get(url).text
