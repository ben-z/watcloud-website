import argparse
import csv
import json
import re
import sys
import textwrap
from itertools import chain
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from directory.scripts.affiliation_utils import get_all_affiliations
from directory.scripts.directory_utils import get_directory_config

def generate_affiliations():
    affiliations = get_all_affiliations()
    directory_config = get_directory_config()

    ret = []
    for aff in affiliations:
        ret.append({
            "name": aff["name"],
            "is_legacy": False,
        })
    
    for aff_name in directory_config["legacy_affiliations"]:
        ret.append({
            "name": aff_name,
            "is_legacy": True,
        })
    
    return ret

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate affiliation information for the website.")
    parser.add_argument("output_dir", type=str, help="The directory to output the affiliation information.")
    args = parser.parse_args()
    affiliations = generate_affiliations()
    

    with open(Path(args.output_dir, "affiliation-info.json"), "w") as file:
        json.dump({
            "affiliations": affiliations,
        }, file, indent=2)

