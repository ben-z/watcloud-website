import machineInfoJSON from '@/build/fixtures/machine-info.json'
import { Convert as MachineInfoConvert } from '@/build/fixtures/machine-info'
export type { MachineInfo } from '@/build/fixtures/machine-info'
export const machineInfo = MachineInfoConvert.toMachineInfo(JSON.stringify(machineInfoJSON))

import websiteConfigJSON from '@/build/fixtures/website-config.json'
import { Convert as WebsiteConfigConvert } from '@/build/fixtures/website-config'
export type { WebsiteConfig } from '@/build/fixtures/website-config'
export const websiteConfig = WebsiteConfigConvert.toWebsiteConfig(JSON.stringify(websiteConfigJSON))
