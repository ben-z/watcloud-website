import argparse
import csv
import json
import re
import sys
import textwrap
from itertools import chain
from pathlib import Path

import networkx as nx

sys.path.append(str(Path(__file__).parent.parent.parent))

from directory.scripts.host_utils import get_host_config, get_hosts_in_group


def print_graph_ascii(G):
    print("Nodes:")
    for node in G.nodes:
        print(f"{node}: {G.nodes[node]}")
    print("\nEdges:")
    for edge in G.edges:
        print(f"{edge[0]} -- {edge[1]}: {G.edges[edge]}")


def get_network_from_hostname(hostname, networks):
    for network in networks:
        for regex in network["hostname_regexes"]:
            if re.match(regex, hostname):
                return network

    return None


def generate_network_graph():
    host_config = get_host_config()

    networks = host_config["networks"]
    login_nodes = get_hosts_in_group(host_config, "login_nodes")
    bastion_nodes = get_hosts_in_group(host_config, "bastion_nodes")

    G = nx.Graph()

    G.add_node("_entrypoint", type="entrypoint")

    for network in networks:
        G.add_node(network["name"], type="network", display_name=f"{network['name'].capitalize()} Network")

    for node in chain(login_nodes, bastion_nodes):
        G.add_node(node["name"], type="host")

        for nn in node["networks"]:
            is_entrypoint = nn["is_accessible_from_internet"]

            for record in nn.get("dns_records", []):
                hostname = record["name"]
                if is_entrypoint:
                    G.add_edge(node["name"], "_entrypoint", hostname=hostname)

                network = get_network_from_hostname(hostname, networks)
                if network is None:
                    if not is_entrypoint:
                        print(
                            f"WARNING: No network found for hostname {hostname}, skipping",
                            file=sys.stderr,
                        )
                    continue

                G.add_edge(
                    node["name"],
                    network["name"],
                    hostname=hostname,
                )

    G.add_node("UWaterloo VPN", type="service")
    G.add_edge(
        "UWaterloo VPN",
        "_entrypoint",
        instructions=[
            "Connect to the [UWaterloo VPN](https://uwaterloo.atlassian.net/wiki/spaces/ISTKB/pages/262012980/Virtual+Private+Network+VPN)",
        ],
    )
    G.add_edge("UWaterloo VPN", "university")

    G.add_node("UWaterloo Campus", type="service")
    G.add_edge(
        "UWaterloo Campus",
        "_entrypoint",
        instructions=[
            "Connect to the UWaterloo network (e.g. on-campus Ethernet or Eduroam Wi-Fi)",
        ],
    )
    G.add_edge("UWaterloo Campus", "university")

    return G


def generate_ssh_command(hostnames):
    assert len(hostnames) > 0, "Expected at least one hostname, got 0"
    assert (
        len(hostnames) <= 2
    ), f"Expected at most 2 hostnames, got {len(hostnames)}: {hostnames}"

    if len(hostnames) == 1:
        return f"ssh -v -i '__SSH_KEY_PATH__' __SSH_USER__@{hostnames[0]}"

    return (
        r"""
            ssh -v -o ProxyCommand="ssh -W %h:%p -i '__SSH_KEY_PATH__' __SSH_USER__@__JUMP_HOST__" -i '__SSH_KEY_PATH__' __SSH_USER__@__HOST__
        """.replace("__JUMP_HOST__", hostnames[0]).replace("__HOST__", hostnames[1]).strip()
    )


def generate_ssh_markdown(hostnames):
    return textwrap.dedent(f"""
        Run the following command:
        
        ```bash copy
        {generate_ssh_command(hostnames)}
        ```
    """).strip()


def generate_ssh_info():
    G = generate_network_graph()

    print(
        f"Generated SSH network graph with {G.number_of_nodes()} graph nodes and {G.number_of_edges()} graph edges"
    )
    print_graph_ascii(G)

    shortest_paths = {
        n: list(nx.all_shortest_paths(G, source="_entrypoint", target=n))
        for n in G.nodes
        if G.nodes[n]["type"] == "host"
    }

    ssh_info = {}
    for n, paths in shortest_paths.items():
        ssh_info[n] = {"paths": []}
        for path in paths:
            assert (
                len(path) <= 4
            ), f"Expected at most 4 path nodes (2 hops), got {len(path)}: {path}"

            instructions = []
            ssh_host_chain = []

            for edge in zip(path, path[1:]):
                _source, target = edge

                edge_props = G.edges[edge]

                if G.nodes[target]["type"] == "host":
                    ssh_host_chain.append(edge_props["hostname"])
                elif G.nodes[target]["type"] == "service":
                    if len(ssh_host_chain) > 0:
                        instructions.append(generate_ssh_markdown(ssh_host_chain))
                        ssh_host_chain = []
                    instructions.extend(edge_props["instructions"])
                elif G.nodes[target]["type"] == "network":
                    pass  # noop
                else:
                    raise ValueError(
                        f"Unexpected node type: {G.nodes[target]} in edge {edge}. Path: {path}"
                    )

            if len(ssh_host_chain) > 0:
                instructions.append(generate_ssh_markdown(ssh_host_chain))

            ssh_info[n]["paths"].append(
                {
                    "hops": [
                        G.nodes[n].get("display_name", n) for n in path if G.nodes[n]["type"] in ["host", "service", "network"]
                    ],
                    "instructions": instructions,
                }
            )

    return ssh_info

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate information required for SSH instructions"
    )
    parser.add_argument("fixtures_path", type=str, help="Path to fixtures")
    args = parser.parse_args()
    fixtures = generate_ssh_info()
    with open(Path(args.fixtures_path, "ssh-info.json"), "w") as file:
        json.dump(fixtures, file, indent=2)
