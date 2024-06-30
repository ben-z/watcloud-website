import json
from pathlib import Path
import sys
import typer

sys.path.append(str(Path(__file__).parent.parent.parent))

from directory.scripts.user_utils import get_all_users_raw_with_defaults

app = typer.Typer()

@app.command()
def main():
    users = get_all_users_raw_with_defaults()

    ret = {}
    for user in users:
        if user["watcloud_public_profile"]["enabled"]:
            ret[user["general"]["watcloud_username"]] = {
                "watcloud_public_profile": user["watcloud_public_profile"]
            }

    print(json.dumps(ret, indent=2))

if __name__ == "__main__":
    app()