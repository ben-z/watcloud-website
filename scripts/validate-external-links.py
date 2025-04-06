"""
Purpose: Tool to detect broken external links on a website before it
reaches production. Whitelisted URLs are ignored. Write whitelisted
URLs in a file, one per line.
Note: treats a link as external if and only if it doesn't direct to a subpage
of the base URL

"Usage: python3 validate-external-links.py <BASE_URL>"
"""

from curl_cffi import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urldefrag, urlparse
import sys

# Broken links that match these exactly will be ignored.
# Since these links are external, these links will not be recursed on
# when searching for links on a page.
WHITELISTED_URLS = [
	"https://www.linkedin.com/in/alex-boden/"
]

# Broken links that have these as a prefix will be ignored.
# These links will also not be recursed on.
WHITELISTED_PREFIXES = [
    "https://github.com/WATonomous/infra-config",
    "https://github.com/WATonomous/infra-notes",
    # FIXME: ceph.io is down and blocking PRs. This is a temporary workaround
    # Discussion here: https://discord.com/channels/478659303167885314/1331445846121644133
    "https://ceph.io",
]

# These are the URL schemes that are treated as links (internal and external)
SCHEMES = [
    "",
    "https",
    "http"
]


def clean_url(url):
    parsed = urlparse(url)
    return str(parsed.hostname).lower() + parsed.path.lower()


CLEANED_WHITELISTED_URLS = [clean_url(url) for url in WHITELISTED_URLS]
CLEANED_WHITELISTED_PREFIXES = [clean_url(url) for url in WHITELISTED_PREFIXES]


if len(sys.argv) < 2:
    print(f"Usage: python3 {__file__} <BASE_URL>")
    sys.exit(1)

BASE_URL = sys.argv[1]


class ExternalLink:
    def __init__(self, is_broken: bool, page: str,
                 dest: str, code: int, err_str: str):
        self.is_broken = is_broken  # Whether the link is broken or not
        self.page = page            # The internal page that the link is located in
        self.dest = dest            # The external site the link directs to
        self.code = code            # The status code returned from the external site
        self.err_str = err_str      # The meaning of the status code


def recursively_fetch_internal_pages(visited, url) -> None:
    if is_external_url(url):
        return

    if url in visited:
        return

    visited.add(url)
    links = get_links_on_page(url)
    for link in links:
        # Recurse on links ignoring fragments for efficiency
        defragged_link, _ = urldefrag(link)
        recursively_fetch_internal_pages(visited, defragged_link)


def is_external_url(url):
    return not url.startswith(BASE_URL.rstrip("/"))


def check_link(url: str, page: str, attempt: int = 1) -> ExternalLink:
    print(f"Checking link {url}")
    print(f"    on page {page}")
    print(f"    attempt {attempt}")
    try:
        request_response = requests.get(url, allow_redirects=True,
                                        impersonate="safari", timeout=10*attempt)

        # Get the HTTP status code
        request_code = request_response.status_code

        if request_code == 200:
            return ExternalLink(False, page, url, request_code, "")

        # Consider these status codes as broken
        if request_code == 401:
            err_str = "Unauthorized"
        elif request_code == 403:
            err_str = "Forbidden"
        elif request_code == 404:
            err_str = "Page not found"
        elif request_code >= 400 and request_code < 500:
            err_str = "Client error"
        elif request_code >= 500:
            err_str = "Server error (possibly because of authentication)"
        elif request_response.history and \
            (request_response.history[-1].status_code == 302 or
                request_response.history[-1].status_code == 307):
            # Redirect likely due to no authorization
            request_code = request_response.history[-1].status_code
            err_str = "Unauthorized redirect (likely)"
        else:
            err_str = "Unspecified error"

        if attempt < 3:
            return check_link(url, page, attempt + 1)
        return ExternalLink(True, page, url, request_code, err_str)

    except requests.exceptions.Timeout:
        if attempt < 3:
            return check_link(url, page, attempt + 1)
        return ExternalLink(True, page, url, -1, "Timeout")
    except requests.exceptions.RequestException as e:
        # Any error like connection issues are treated as broken links
        if attempt < 3:
            return check_link(url, page, attempt + 1)
        return ExternalLink(True, page, url, -1, f'Request exception: {str(e)}')


def get_links_on_page(url):
    try:
        response = requests.get(url)

        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract all anchor tags with href attributes
        all_links = [a.get('href') for a in soup.find_all('a', href=True)]
        filtered_links = [url for url in all_links if urlparse(url).scheme in SCHEMES]

        # Join relative URLs with the base URL to form complete links
        return [urljoin(url, link) for link in filtered_links]
    except:
        return []


def is_whitelisted(url):
    url = clean_url(url)

    if url in CLEANED_WHITELISTED_URLS:
        return True

    for wl_prefix in CLEANED_WHITELISTED_PREFIXES:
        if url.startswith(wl_prefix):
            return True

    return False


if __name__ == "__main__":
    internal_urls = set()
    print("Recursively fetching internal pages...")
    recursively_fetch_internal_pages(internal_urls, BASE_URL)
    print(f"Fetched {len(internal_urls)} internal pages")

    print("Checking external links...")
    external_links = []
    for internal_url in internal_urls:
        external_links += [check_link(link, internal_url) for link
                           in get_links_on_page(internal_url)
                           if is_external_url(link)]

    broken_count = 0
    whitelist_ignores_count = 0
    for external_link in external_links:

        if not external_link.is_broken:
            continue

        if is_whitelisted(external_link.dest):
            whitelist_ignores_count += 1
            continue

        broken_count += 1
        print(f"{external_link.code} {external_link.err_str}")
        print(f"    link {external_link.dest}")
        print(f"    on page {external_link.page}")

    print("DONE")
    print(f"{len(external_links)} external links in total")
    print(f"{whitelist_ignores_count} broken whitelisted links ignored")
    print(f"{broken_count} broken links")

    if broken_count:
        sys.exit(1)

    sys.exit(0)
