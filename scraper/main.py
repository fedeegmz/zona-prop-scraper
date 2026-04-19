import sys
import os

import pandas as pd

from src import utils
from src.browser import Browser
from src.json_scraper import JSONScraper


def main(url: str):
    base_url = utils.parse_zonaprop_url(url)
    print(f"Running scraper for {base_url}")
    print("This may take a while...")
    browser = Browser()
    scraper = JSONScraper(browser, base_url)
    estates = scraper.scrap_website()
    df = pd.DataFrame(estates)
    print("Scraping finished !!!")
    print("Saving data to csv file")
    filename = utils.get_filename_from_datetime(base_url, "csv")
    utils.save_df_to_csv(df, filename)
    print(f"Data saved to {filename}")

    # Save a second copy to web-app public for immediate consumption
    web_app_data_path = "../web-app/public/data.csv"
    os.makedirs(os.path.dirname(web_app_data_path), exist_ok=True)
    df.to_csv(web_app_data_path, index=False)
    print(f"Data synced to {web_app_data_path}")

    print("Scrap finished !!!")


if __name__ == "__main__":
    arg_url: str = (
        sys.argv[1] or "https://www.zonaprop.com.ar/departamentos-alquiler.html"
    )
    main(arg_url)
