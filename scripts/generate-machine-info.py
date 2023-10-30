import argparse
import csv
import json
import yaml
from pathlib import Path

def parse_colon_separated_file(s: str):
    lines = s.split("\n")

    data = {}
    for line in lines:
        if not line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip()
    
    return data

def get_file_lines(data_path, host_name, file_name):
    file_path = Path(data_path, "general", host_name, file_name)
    if not file_path.exists():
        return []
    
    return [s.strip() for s in file_path.read_text().split("\n") if s.strip() != ""]

def get_cpu_info(data_path, host_name):
    cpu_info_path = Path(data_path, "general", host_name, "lscpu.log")
    if not cpu_info_path.exists():
        return {}

    cpu_info_str = cpu_info_path.read_text()
    cpu_info_dict = parse_colon_separated_file(cpu_info_str)
    return {
        "model": cpu_info_dict["Model name"],
        "logical_processors": cpu_info_dict["CPU(s)"],
        "threads_per_core": cpu_info_dict["Thread(s) per core"],
    }

def get_gpu_info(data_path, host_name):
    gpu_info_path = Path(data_path, "general", host_name, "nvidia-smi.csv")
    if not gpu_info_path.exists():
        return []
    
    with open(gpu_info_path, 'r') as file:
        reader = csv.DictReader(file, skipinitialspace=True)
        gpus = list(reader)
    
    return gpus

def get_memory_info(data_path, host_name):
    memory_info_path = Path(data_path, "general", host_name, "meminfo-total.log")
    if not memory_info_path.exists():
        return {}
    
    memory_info_str = memory_info_path.read_text()
    memory_info_dict = parse_colon_separated_file(memory_info_str)
    return {
        "memory_total_kibibytes": memory_info_dict["MemTotal"].split(" ")[0],
        "swap_total_kilobytes": memory_info_dict["SwapTotal"].split(" ")[0],
    }

def get_lsb_release_info(data_path, host_name):
    lsb_release_info_path = Path(data_path, "general", host_name, "lsb-release.log")
    if not lsb_release_info_path.exists():
        return {}
    
    lsb_release_info_str = lsb_release_info_path.read_text()
    lsb_release_info_dict = parse_colon_separated_file(lsb_release_info_str)
    return {
        "description": lsb_release_info_dict["Description"],
    }

def get_hosted_storage(data_path, host_name):
    exportfs_path = Path(data_path, "general", host_name, "exportfs.log")
    df_path = Path(data_path, "general", host_name, "df-total.log")
    if not exportfs_path.exists() or not df_path.exists():
        return []

    mount_to_size = {}
    df_log = df_path.read_text()
    for line_raw in df_log.split("\n"):
        line = line_raw.strip()
        if line == "":
            continue
        
        bytes, mountpoint = line.split(" ", 1)
        mount_to_size[mountpoint] = bytes
    
    exportfs_log = exportfs_path.read_text()
    exports = []
    for line_raw in exportfs_log.split("\n"):
        line = line_raw.strip()
        if line == "":
            continue
        
        if line not in mount_to_size:
            raise Exception(f"Mountpoint {line} not found in df log")
        
        exports.append({
            "mountpoint": line,
            "size_bytes": mount_to_size[line],
        })
    
    return exports

def generate_fixtures(host_config_path, data_path):
    with open(host_config_path, 'r') as file:
        host_config = yaml.safe_load(file)
    
    dev_vms = []
    bare_metals = []
    bastions = []
    
    for host in host_config["hosts"]:
        group_names = [g["name"] for g in host["groups"]]
        if "ubuntu_dev_vm_nodes" in group_names:
            name = host["name"]
            properties = {
                "name": name,
                "cpu_info": get_cpu_info(data_path, name),
                "memory_info": get_memory_info(data_path, name),
                "gpus": get_gpu_info(data_path, name),
                "hostnames": [r["name"] for n in host["networks"] for r in n.get("dns_records",[])],
                "lsb_release_info": get_lsb_release_info(data_path, name),
                "ssh_host_keys": get_file_lines(data_path, name, "ssh-host-keys.log"),
            }
            dev_vms.append(properties)
        if "bare_metal_nodes" in group_names:
            name = host["name"]
            properties = {
                "name": name,
                "cpu_info": get_cpu_info(data_path, name),
                "memory_info": get_memory_info(data_path, name),
                "hosted_storage": get_hosted_storage(data_path, name),
            }
            bare_metals.append(properties)
        if "bastion_nodes" in group_names:
            name = host["name"]
            properties = {
                "name": name,
                "cpu_info": get_cpu_info(data_path, name),
                "memory_info": get_memory_info(data_path, name),
                "hostnames": [r["name"] for n in host["networks"] for r in n.get("dns_records",[])],
                "ssh_host_keys_bastion": get_file_lines(data_path, name, "ssh-host-keys-bastion.log"),
            }
            bastions.append(properties)
    
    return {
        "dev_vms": sorted(dev_vms, key=lambda m: int(m["cpu_info"]["logical_processors"]), reverse=True),
        "bare_metals": sorted(bare_metals, key=lambda m: int(m["cpu_info"]["logical_processors"]), reverse=True),
        "bastions": sorted(bastions, key=lambda m: int(m["cpu_info"]["logical_processors"]), reverse=True),
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate machine info from gathered data')
    parser.add_argument('host_config_path', type=str, help='Path to host config')
    parser.add_argument('data_path', type=str, help='Path to data')
    parser.add_argument('fixtures_path', type=str, help='Path to fixtures')
    args = parser.parse_args()
    fixtures = generate_fixtures(args.host_config_path, args.data_path)
    with open(Path(args.fixtures_path, "machine-info.json"), 'w') as file:
        json.dump(fixtures, file, indent=2)
