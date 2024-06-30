import machineInfoJSON from '@/build/fixtures/machine-info.json'
import { Convert as MachineInfoConvert } from '@/build/fixtures/machine-info'
export type { MachineInfo } from '@/build/fixtures/machine-info'
export const machineInfo = MachineInfoConvert.toMachineInfo(JSON.stringify(machineInfoJSON))

import sshInfoJSON from '@/build/fixtures/ssh-info.json'
import { Convert as SshInfoConvert } from '@/build/fixtures/ssh-info'
export type { SSHInfo } from '@/build/fixtures/ssh-info'
export const sshInfo = SshInfoConvert.toSSHInfo(JSON.stringify(sshInfoJSON))
import sshInfoStrings from '@/build/fixtures/ssh-info-strings/strings'
export { sshInfoStrings }

import affiliationInfoJSON from '@/build/fixtures/affiliation-info.json'
import { Convert as AffiliationInfoConvert } from '@/build/fixtures/affiliation-info'
export type { AffiliationInfo } from '@/build/fixtures/affiliation-info'
export const affiliationInfo = AffiliationInfoConvert.toAffiliationInfo(JSON.stringify(affiliationInfoJSON))

import websiteConfigJSON from '@/build/fixtures/website-config.json'
import { Convert as WebsiteConfigConvert } from '@/build/fixtures/website-config'
export type { WebsiteConfig } from '@/build/fixtures/website-config'
export const websiteConfig = WebsiteConfigConvert.toWebsiteConfig(JSON.stringify(websiteConfigJSON))

import userProfilesJSON from '@/build/fixtures/user-profiles.json'
import { Convert as UserProfilesConvert } from '@/build/fixtures/user-profiles'
export type { UserProfiles } from '@/build/fixtures/user-profiles'
export const userProfiles = UserProfilesConvert.toUserProfiles(JSON.stringify(userProfilesJSON))

import userSchemaStrings from '@/build/fixtures/user-schema-strings/strings'
export { userSchemaStrings }

import { hashCode } from './utils'
export function lookupStringMDX(strings: Record<string, any>, str: string) {
    if (!str) {
        return null
    }
    const h = hashCode(str)
    const mdxComponent = strings[String(h)]
    if (!mdxComponent) {
        console.error(`No MDX component found for string: "${str}"`)
        return null
    }
    return mdxComponent
}