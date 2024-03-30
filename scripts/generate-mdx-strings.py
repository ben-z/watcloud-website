import json
import typer
import hashlib
from pathlib import Path

app = typer.Typer()

def hash_code(s):
    """Returns a hash code from a string.

    Args:
        s (str): The string to hash.

    Returns:
        int: A 32-bit integer hash of the string.

    References:
        - http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
        - https://stackoverflow.com/a/8831937
    """
    hash = 0
    for char in s:
        hash = (hash << 5) - hash + ord(char)
        hash &= 0xFFFFFFFF  # Convert to 32bit integer
    return hash


# Derived from:
# https://chat.openai.com/share/41d568ff-b124-4144-a19e-b51938adf7ce
@app.command()
def get_all_strings(json_file_path):
    # Load the JSON data from the file
    with open(json_file_path, "r") as file:
        data = json.load(file)

    def extract_strings(element, result):
        if isinstance(element, dict):  # If element is a dictionary
            for value in element.values():
                extract_strings(value, result)
        elif isinstance(element, list):  # If element is a list
            for item in element:
                extract_strings(item, result)
        elif isinstance(element, str):  # If element is a string
            result.append(element)

    # Initialize an empty list to hold the strings
    strings = []
    # Extract strings from the loaded JSON data
    extract_strings(data, strings)

    return strings

@app.command()
def dump_mdx(strings: list[str], output_dir: str):
    output_dir = Path(output_dir)
    Path.mkdir(output_dir, exist_ok=True)

    for s in strings:
        basename = f"{hash_code(s)}.mdx"

        with open(output_dir / basename, "w") as file:
            file.write(s)

    print(f"Dumped {len(strings)} strings to {output_dir}")

@app.command()
def json_to_mdx(json_file_path: str, output_dir: str):
    strings = get_all_strings(json_file_path)
    dump_mdx(strings, output_dir)

if __name__ == '__main__':
    app()