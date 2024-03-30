import machineInfoJSON from '@/build/fixtures/machine-info.json'
import { Convert as MachineInfoConvert } from '@/build/fixtures/machine-info'
export type { MachineInfo } from '@/build/fixtures/machine-info'
export const machineInfo = MachineInfoConvert.toMachineInfo(JSON.stringify(machineInfoJSON))

import sshInfoJSON from '@/build/fixtures/ssh-info.json'
import { Convert as SshInfoConvert } from '@/build/fixtures/ssh-info'
export type { SSHInfo } from '@/build/fixtures/ssh-info'
export const sshInfo = SshInfoConvert.toSSHInfo(JSON.stringify(sshInfoJSON))

import websiteConfigJSON from '@/build/fixtures/website-config.json'
import { Convert as WebsiteConfigConvert } from '@/build/fixtures/website-config'
export type { WebsiteConfig } from '@/build/fixtures/website-config'
export const websiteConfig = WebsiteConfigConvert.toWebsiteConfig(JSON.stringify(websiteConfigJSON))

import { hashCode } from './wato-utils'
export function lookupStringMDX(str: string) {
    const basename = `${hashCode(str)}.mdx`
    return import(`@/build/fixtures/strings/${basename}`)
}