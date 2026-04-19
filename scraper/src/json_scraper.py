import json
import time
from typing import Any

from .browser import Browser

PAGE_URL_SUFFIX = "-pagina-"
HTML_EXTENSION = ".html"
BASE_ZONAPROP_HOST = "https://www.zonaprop.com.ar"


class JSONScraper:
    def __init__(self, browser: Browser, base_url: str) -> None:
        self.browser = browser
        self.base_url = base_url

    def scrap_page(self, page_number: int) -> list[Any]:
        if page_number == 1:
            page_url = f"{self.base_url}{HTML_EXTENSION}"
        else:
            page_url = f"{self.base_url}{PAGE_URL_SUFFIX}{page_number}{HTML_EXTENSION}"

        print(f"URL: {page_url}")
        page_html = self.browser.get_text(page_url)

        prefix = "window.__PRELOADED_STATE__ = "
        idx = page_html.find(prefix)
        if idx == -1:
            print("Could not find __PRELOADED_STATE__ in the page.")
            return []

        json_str = page_html[idx + len(prefix) :]
        # parse raw JSON and ignore any trailing JS code
        try:
            data, _ = json.JSONDecoder().raw_decode(json_str)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON state: {e}")
            return []

        postings = data.get("listStore", {}).get("listPostings", [])

        estates = []
        for posting in postings:
            estate = self.parse_estate(posting)
            estates.append(estate)

        print(f"Scraped page {page_number} - Found {len(estates)} estates")
        return estates

    def scrap_website(self) -> list[Any]:
        page_number = 1
        estates = []
        # get total quantities to stop
        estates_quantity = self.get_estates_quantity()
        print(f"Total estates reported by search: {estates_quantity}")

        while estates_quantity > len(estates):
            # break early like the original did for debug
            if page_number == 2:
                break

            print(f"Page: {page_number}")
            new_estates = self.scrap_page(page_number)
            if not new_estates:
                break
            estates += new_estates
            page_number += 1
            time.sleep(3)

        return estates

    def get_estates_quantity(self) -> int:
        from bs4 import BeautifulSoup
        import re

        page_url = f"{self.base_url}{HTML_EXTENSION}"
        page = self.browser.get_text(page_url)
        soup = BeautifulSoup(page, "lxml")
        try:
            first_h1 = soup.find_all("h1")[0].text
            estates_quantity = re.findall(r"\d+\.?\d*", first_h1)[0]
            estates_quantity = estates_quantity.replace(".", "")
            return int(estates_quantity)
        except Exception as e:
            print(f"Error parsing estates quantity: {e}")
            return 1  # Fallback to at least 1 so it runs once

    def parse_estate(self, posting: dict[Any, Any]) -> dict[Any, Any]:
        estate = {}

        # 1. URL completa
        relative_url = posting.get("url") or ""
        estate["url"] = (
            BASE_ZONAPROP_HOST + relative_url
            if relative_url.startswith("/")
            else relative_url
        )

        # 2. Direccion + Barrio
        posting_loc = posting.get("postingLocation") or {}
        address_name = posting_loc.get("address") or {}
        address_name = address_name.get("name", "")
        location_name = posting_loc.get("location") or {}
        location_name = location_name.get("name", "")

        # combine them if they are different and exist
        if location_name and location_name not in address_name:
            estate["address"] = f"{address_name}, {location_name}".strip(", ")
        else:
            estate["address"] = address_name

        # 3. Ubicacion (coordenadas)
        posting_geo = posting_loc.get("postingGeolocation") or {}
        geo = posting_geo.get("geolocation") or {}
        estate["latitude"] = geo.get("latitude")
        estate["longitude"] = geo.get("longitude")

        # 4. Precio
        prices_ops = posting.get("priceOperationTypes") or []
        if prices_ops:
            prices = prices_ops[0].get("prices") or []
            if prices:
                amount = prices[0].get("amount")
                currency = prices[0].get("currency")
                estate["price_value"] = amount
                estate["price_currency"] = currency

        # 5. Expensas
        expenses = posting.get("expenses") or {}
        if expenses:
            estate["expenses_value"] = expenses.get("amount")
            estate["expenses_currency"] = expenses.get("currency")

        # 6. Mas datos (Features)
        features = posting.get("mainFeatures") or {}
        for f_key, f_data in features.items():
            if not f_data:
                continue
            label = f_data.get("label", "").lower()
            value = f_data.get("value", "")

            # Map standard features logically
            if "superficie total" in label:
                estate["square_meters_area"] = value
            elif "superficie cubierta" in label:
                estate["square_meters_area"] = estate.get("square_meters_area") or value
            elif "ambientes" in label:
                estate["rooms"] = value
            elif "dormitorio" in label:
                estate["bedrooms"] = value
            elif "baño" in label:
                estate["bathrooms"] = value
            elif "cochera" in label:
                estate["parking"] = value

        return estate
