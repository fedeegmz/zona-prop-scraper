import datetime
import os
import re

from pandas import DataFrame


def remove_host_from_url(url: str) -> str:
    host_regex = r"(^https?://)(.*/)"
    return re.sub(host_regex, "", url)


def get_filename_from_datetime(base_url: str, extension: str) -> str:
    base_url_without_host = remove_host_from_url(base_url)
    return f"data/{base_url_without_host}-{datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.{extension}"


def save_df_to_csv(df: DataFrame, filename: str):
    create_root_directory(filename)
    df.to_csv(filename, index=False)


def parse_zonaprop_url(url: str) -> str:
    return url.replace(".html", "")


def create_root_directory(filename: str) -> None:
    os.makedirs(os.path.dirname(filename), exist_ok=True)
