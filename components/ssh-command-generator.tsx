import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Pre, Code } from 'nextra/components'
import stripIndent from 'strip-indent';
import {
    HelpCircle,
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ComboBox } from '@/components/ui/combo-box'
import { Input } from "@/components/ui/input"
import { machineInfo } from '@/lib/data'
import { hostnameSorter } from '@/lib/wato-utils'

const DEFAULT_MACHINE_NAME = machineInfo.dev_vms[0].name
const ACCESSIBLE_MACHINES = Object.fromEntries([...machineInfo.dev_vms, ...machineInfo.bastions].map(m => [m.name, m]))
const BASTION_NAMES = machineInfo.bastions.map(m => m.name)
const ACCESSIBLE_MACHINE_LIST = Object.keys(ACCESSIBLE_MACHINES).map(m => ({value: m, label: m}))
const HOSTNAME_TO_MACHINE_NAME = Object.fromEntries(Object.entries(ACCESSIBLE_MACHINES).flatMap(([machineName, machine]) => machine.hostnames?.map(hostname => [hostname, machineName]) || []))
const ALL_ENTRYPOINTS: Map<string,string> = new Map(Object.entries({
    "direct": "Direct",
    "uw-vpn": "UW VPN",
    "uw-campus": "UW Campus",
    ...Object.fromEntries(machineInfo.bastions.map(b => [b.name, b.name])),
}))

function getEntrypointToHostnamesMap(machineName: string, hostnames: string[]): Map<string, Set<string>> {
    const ret: Map<string, Set<string>> = new Map()

    // All bastions are to be accessed directly
    if (BASTION_NAMES.includes(machineName)) {
        ret.set('direct', new Set(hostnames))
        return ret
    }

    for (const hostname of hostnames) {
        if (hostname.endsWith(".ext.watonomous.ca")) {
            ret.set('uw-vpn', ret.get('uw-vpn') || new Set())
            ret.get('uw-vpn')!.add(hostname)
            ret.set('uw-campus', ret.get('uw-campus') || new Set())
            ret.get('uw-campus')!.add(hostname)
            for (const bastion of machineInfo.bastions) {
                ret.set(bastion.name, ret.get(bastion.name) || new Set())
                ret.get(bastion.name)!.add(hostname)
            }
        } else if (hostname.endsWith(".cluster.watonomous.ca")) {
            for (const bastion of machineInfo.bastions) {
                ret.set(bastion.name, ret.get(bastion.name) || new Set())
                ret.get(bastion.name)!.add(hostname)
            }
        }
    }

    return ret
}

export function SSHCommandGenerator() {
    const router = useRouter()
    const queryHostname = Array.isArray(router.query.hostname) ? router.query.hostname[0] : router.query.hostname || ""

    const [_machineName, _setMachineName] = useState("")
    const [_hostname, _setHostname] = useState("")
    const [_entrypoint, _setEntrypoint] = useState("")
    const [username, _setUsername] = useState("")
    const [sshKeyPath, _setSSHKeyPath] = useState("")

    const machineName = _machineName || HOSTNAME_TO_MACHINE_NAME[queryHostname] || DEFAULT_MACHINE_NAME
    const machineHostnames = useMemo(() => ACCESSIBLE_MACHINES[machineName]?.hostnames?.toSorted(hostnameSorter) || [], [machineName])
    const entrypointToHostnamesMap = useMemo(() => getEntrypointToHostnamesMap(machineName, machineHostnames), [machineName, machineHostnames])
    const entrypoint = _entrypoint || entrypointToHostnamesMap.keys().next()?.value || ""
    const hostname = entrypointToHostnamesMap.get(entrypoint)?.has(_hostname || queryHostname) ? (_hostname || queryHostname) : (entrypointToHostnamesMap.get(entrypoint)?.values().next()?.value || "")

    const entrypointOptions = [...entrypointToHostnamesMap.keys()].map(k => ({value: k, label: ALL_ENTRYPOINTS.get(k)!}))
    const hostnameOptions = [...entrypointToHostnamesMap.get(entrypoint) || []].map(h => ({value: h, label: h}))

    function setHostname(h: string) {
        _setHostname(h)
    }
    function setEntrypoint(e: string) {
        _setEntrypoint(e)
        setHostname("")
    }
    function setMachineName(n: string) {
        _setMachineName(n)
        setEntrypoint("")
    }
    function setUsername(u: string) {
        _setUsername(u)
        localStorage.setItem("wato_ssh_command_generator_username", u)
    }
    function setSSHKeyPath(p: string) {
        _setSSHKeyPath(p)
        localStorage.setItem("wato_ssh_command_generator_ssh_key_path", p)
    }
    function setUsernameEvt(e: React.ChangeEvent<HTMLInputElement>) {
        setUsername(e.target.value)
    }
    function setSSHKeyPathEvt(e: React.ChangeEvent<HTMLInputElement>) {
        setSSHKeyPath(e.target.value)
    }

    // Attempt to populate fields from local storage. This is useful for users who have
    // previously used the SSH command generator.
    // We pass an empty dependency array to useEffect to ensure that this code is only run once
    // at startup
    useEffect(() => {
        if (!username) {
            const storedUsername = localStorage.getItem("wato_ssh_command_generator_username")
            if (storedUsername) {
                setUsername(storedUsername)
            }
        }
        if (!sshKeyPath) {
            const storedSSHKeyPath = localStorage.getItem("wato_ssh_command_generator_ssh_key_path")
            if (storedSSHKeyPath) {
                setSSHKeyPath(storedSSHKeyPath)
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const displaySSHKeyPath = sshKeyPath || "<ssh_key_path>"
    const displayUsername = (username || "<username>").replace(/\$$/, "\\$")
    const displayHostname = hostname || "<hostname>"

    let sshCommand = "";
    if (["direct", "uw-vpn", "uw-campus"].includes(entrypoint)) {
        let preamble = "";
        if (entrypoint === "uw-vpn") {
            preamble = stripIndent(`
                # 1. Connect to the UW VPN:
                # https://uwaterloo.ca/web-resources/resources/virtual-private-network-vpn
                #
                # 2. Run the following command to connect to ${machineName}:
            `).trim() + "\n"
        } else if (entrypoint === "uw-campus") {
            preamble = stripIndent(`
                # 1. Connect to the UW Campus network (e.g. using Eduroam)
                #
                # 2. Run the following command to connect to ${machineName}:
            `).trim() + "\n"
        }
        sshCommand = preamble + stripIndent(`
            ssh -v -i "${displaySSHKeyPath}" "${displayUsername}@${displayHostname}"
        `).trim()
    } else if (BASTION_NAMES.includes(entrypoint)) {
        const jump_host = ACCESSIBLE_MACHINES[entrypoint]
        const jump_host_hostname = jump_host.hostnames?.[0]
        if (!jump_host_hostname) {
            console.error(`Error generating SSH command! Jump host ${entrypoint} has no hostnames.`)
        }
        sshCommand = stripIndent(`
            # Connect to ${machineName} via ${jump_host.name} (${jump_host_hostname})
            ssh -v -o ProxyCommand="ssh -W %h:%p -i \\"${displaySSHKeyPath}\\" \\"${displayUsername}@${jump_host_hostname}\\"" -i "${displaySSHKeyPath}" "${displayUsername}@${displayHostname}"
        `).trim()
    } else {
        sshCommand = stripIndent(`
            # Error generating SSH command! Please report this issue to the WATO team.
            # Debug info:
            #  machineName: ${machineName}
            #  hostname: ${hostname}
            #  entrypoint: ${entrypoint}
        `).trim()
    }

    return (
        <>
            <dl className="text-gray-900 divide-y divide-gray-200 dark:text-white dark:divide-gray-700 overflow-hidden">
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">Machine</dt>
                <dd className='border-none'>
                    <ComboBox
                        options={ACCESSIBLE_MACHINE_LIST}
                        value={machineName}
                        setValue={setMachineName}
                        selectPlaceholder="Select machine"
                        searchPlaceholder="Find machine..."
                        emptySearchResultText="No machines found"
                        allowDeselect={false}
                    />
                </dd>
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">
                    <Popover>
                        Entrypoint{<PopoverTrigger><HelpCircle className="ml-1 mr-1 h-3 w-3 text-muted-foreground" /></PopoverTrigger>}
                        <PopoverContent side="top">
                            The entrypoint determines how you connect to the machine.
                        </PopoverContent>
                    </Popover>
                </dt>
                <dd className='border-none'>
                    <ComboBox
                        options={entrypointOptions}
                        value={entrypoint}
                        setValue={setEntrypoint}
                        selectPlaceholder="Select entrypoint"
                        searchPlaceholder="Find entrypoint..."
                        emptySearchResultText="No entrypoints found"
                        allowDeselect={false}
                    />
                </dd>
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">
                    <Popover>
                        Hostname{<PopoverTrigger><HelpCircle className="ml-1 mr-1 h-3 w-3 text-muted-foreground" /></PopoverTrigger>}
                        <PopoverContent side="top">
                            A machine may be reachable via multiple hostnames.
                        </PopoverContent>
                    </Popover>
                </dt>
                <dd className='border-none'>
                    <ComboBox
                        options={hostnameOptions}
                        value={hostname}
                        setValue={setHostname}
                        selectPlaceholder="Select hostname"
                        searchPlaceholder="Find hostname..."
                        emptySearchResultText="No hostnames found"
                        popoverContentClassName="w-120"
                        allowDeselect={false}
                    />
                </dd>
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">
                    <Popover>
                        Compute Cluster Username{<PopoverTrigger><HelpCircle className="ml-1 mr-1 h-3 w-3 text-muted-foreground" /></PopoverTrigger>}
                        <PopoverContent side="top">
                            The username that you submitted via the onboarding form.
                        </PopoverContent>
                    </Popover>
                </dt>
                <dd className='border-none'>
                    <Input
                        type="text"
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="E.g. jdoe"
                        value={username}
                        onChange={setUsernameEvt}
                        autoComplete='off'
                    />
                </dd>
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">
                    <Popover>
                        SSH Key Path{<PopoverTrigger><HelpCircle className="ml-1 mr-1 h-3 w-3 text-muted-foreground" /></PopoverTrigger>}
                        <PopoverContent side="top">
                            The path to the SSH key that you submitted via the onboarding form.
                        </PopoverContent>
                    </Popover>
                </dt>
                <dd className='border-none'>
                    <Input
                        type="text"
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="E.g. ~/.ssh/id_rsa"
                        value={sshKeyPath}
                        onChange={setSSHKeyPathEvt}
                        autoComplete='off'
                    />
                </dd>
                <dt className="mb-1 mt-2 text-gray-500 dark:text-gray-400 border-none">Generated SSH Command</dt>
                <dd className='border-none'>
                    <Pre hasCopyCode>
                        <Code>{sshCommand}</Code>
                    </Pre>
                </dd>
            </dl>
        </>
    )
}
