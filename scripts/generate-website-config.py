import argparse
import json
import yaml
from pathlib import Path

def generate_fixtures(outputs_path):
    with open(Path(outputs_path, "discord/outputs.yaml"), 'r') as file:
        discord_outputs = yaml.safe_load(file)
    
    with open(Path(outputs_path, "sentry/outputs.yaml"), 'r') as file:
        sentry_outputs = yaml.safe_load(file)
    
    return {
        "discord_invite_code": discord_outputs["watcloud_website_invite_code"],
        # Obtained from https://healthchecks.io/projects/7acc2ad3-f672-40c9-a061-12c8fd128f8b/settings/
        "healthchecksio_read_key": "tCsst0GSKpfvslmpmlsmivRrUCRuv6Iv",
        "sentry_dsn": sentry_outputs["watcloud-website-dsn"],
        # Obtained from https://analytics.google.com/analytics/web/#/p405574179/reports/intelligenthome
        "ga_measurement_id": "G-F19HMC41TD",
        # Deployed in the Kubernetes cluster
        "sentry_tunnel": "https://stunnel.watonomous.ca/tunnel",
    }
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate website config')
    parser.add_argument('outputs_path', type=str, help='Path to outputs')
    parser.add_argument('fixtures_path', type=str, help='Path to fixtures')
    args = parser.parse_args()
    fixtures = generate_fixtures(args.outputs_path)
    with open(Path(args.fixtures_path, "website-config.json"), 'w') as file:
        json.dump(fixtures, file, indent=2)
