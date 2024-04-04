"""
Purpose: Tool to detect broken internal links on a website before it reaches production.

Use: python3 validate-internal-links.py <BASE_URL> 
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import sys

# CONFIG
if len(sys.argv) < 2:
    print("Usage: python3 check_links.py <BASE_URL>")
    sys.exit(1)

BASE_URL = sys.argv[1] 
DEPLOYED_DOMAIN = "https://cloud.watonomous.ca/"  # Where the build is deployed

fail_build = False

def is_internal_url(url):
    """Check if a URL is internal to the website."""
    return url.startswith(BASE_URL) or url.startswith(DEPLOYED_DOMAIN)

def convert_deployed_domain_to_base(url):
    """Convert a URL from the deployed domain to the base URL."""
    if url.startswith(DEPLOYED_DOMAIN):
        return url.replace(DEPLOYED_DOMAIN, BASE_URL)
    else:
        return url

def get_xpath(element):
    """
    Generate the XPath for a BeautifulSoup element by iterating through its parents.
    """
    parts = []
    child = element if element.name else element.parent
    for parent in child.parents:
        if parent.name is None:
            break  # Document root reached
        siblings = parent.find_all(child.name, recursive=False)
        # Find the index of the child in its siblings array. XPath is 1-based.
        index = siblings.index(child) + 1
        parts.append(f"{child.name}[{index}]")
        child = parent
    parts.reverse()
    return '/' + '/'.join(parts)

def crawl_and_fetch_links(url, visited, internal_links, external_links):
    """Recursively fetch links from the given URL, separating internal and external links."""
    try:
        response = requests.get(url)
    except requests.RequestException as e:
        print(f"Request for {url} failed: {e}")
        global fail_build 
        fail_build = True
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    for a in soup.find_all('a', href=True):
        link = urljoin(url, a.get('href'))
        if link not in visited:
            visited.add(link)
            xpath = get_xpath(a)
            if is_internal_url(link):
                link = convert_deployed_domain_to_base(link)
                internal_links.add((url, link, xpath))
                # print(f"Found internal link: {link} from url: {url} at xpath path: {xpath}")
                link_without_fragment = urlparse(link)._replace(fragment='').geturl()
                crawl_and_fetch_links(link_without_fragment, visited, internal_links, external_links)
            else:
                external_links.add(link)

def crawl_and_fetch_links_wrapper(url):
    """Wrapper function for crawl_and_fetch_links."""
    visited_links = set()
    internal_links_tuples = set() # (source, destination, xpath)
    external_links = set()
    crawl_and_fetch_links(url, visited_links, internal_links_tuples, external_links)
    return internal_links_tuples, external_links

def check_link_validity(full_url, check_fragment=True):
    """Check if a URL, including its fragment, is valid."""
    # Parse the URL to separate it from the fragment
    parsed_url = urlparse(full_url)
    base_url = parsed_url._replace(fragment='').geturl()
    fragment = parsed_url.fragment

    # First, check if the base URL is reachable
    try:
        response = requests.get(base_url, timeout=5)
        if response.status_code != 200:
            return False  
    except requests.RequestException:
        return False  

    # If there's no fragment, the base URL being reachable is sufficient
    if not fragment or not check_fragment:
        return True

    # If there's a fragment, check if it corresponds to an id in the HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    if soup.find(id=fragment) or soup.find_all(attrs={"name": fragment}):
        return True  # Fragment is valid

    # Fragment not found
    return False

def validate_links(links):
    """Check if links are valid."""
    invalid_links = []
    for link in links:
        if not check_link_validity(link):
            invalid_links.append(link)
    return invalid_links

def validate_internal_links(links):
    """Check if internal links are valid."""
    invalid_links = []
    for link in links:
        if not check_link_validity(link[1]):
            invalid_links.append(link)
    return invalid_links

if __name__ == '__main__':
    print("Collecting links...")
    internal_links_tuples, external_links = crawl_and_fetch_links_wrapper(BASE_URL)
    print(f"Found {len(internal_links_tuples)} internal links")
    print(f"Found {len(external_links)} external links")
    invalid_internal_links = validate_internal_links(internal_links_tuples) 

    if len(invalid_internal_links) == 0:
        print(f"All {len(internal_links_tuples)} internal links are valid.")
        sys.exit(0)
    else:
        fail_build = True

    print("ERROR with internal links")
    for link in invalid_internal_links:
        print(f"On page: {link[0]} \nto: \n{link[1]} \nwith XPath: {link[2]}\n")
    print('Hint: Use $x("XPath") in the browser console to find the element.')
    if fail_build:
        sys.exit(1)