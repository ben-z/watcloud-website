import { Link } from "nextra-theme-docs"
import {
    bytesToSize,
    pluralizeWithCount,
    cn,
} from '@/lib/utils'
import heroStyles from '@/styles/hero.module.css'
import { machineInfo } from '@/lib/data'
import dynamic from 'next/dynamic'

const ServerRackScene = dynamic(() => import('./server-rack-scene'), { ssr: false })

const DEV_MACHINES = [
    ...machineInfo.machines.slurm_compute_nodes,
    ...machineInfo.machines.slurm_login_nodes,
    ...machineInfo.machines.legacy_general_use_machines,
]

export function Hero() {
    const vCPUs = DEV_MACHINES.reduce((acc, m) => acc + parseInt(m.cpu_info.logical_processors || "0"), 0)
    const ramBytes = DEV_MACHINES.reduce((acc, m) => acc + parseInt(m.memory_info.memory_total_kibibytes || "0") * 1024, 0)
    const redundantStorageBytes = machineInfo.machines.bare_metals.flatMap(m => m.hosted_storage.map(s => parseInt(s.size_bytes || "0"))).reduce((acc, size) => acc + size, 0)
    const gpuCount = DEV_MACHINES.reduce((acc, m) => acc + m.gpus.length, 0)

    return (
        <div className="hero">
            <div className="hero-inner">
                <div className="hero-text">
                    <h1 className="hero-title">
                        {vCPUs} vCPUs<br />
                        {bytesToSize(ramBytes,0)} RAM<br />
                        {bytesToSize(redundantStorageBytes,0)} Storage<br />
                        {pluralizeWithCount(gpuCount, "GPU")}<br />
                        {"10/40 Gbps Network"}
                    </h1>
                    <p className="hero-subtitle">Welcome to WATcloud. We make powerful computers <br className='sm:block hidden'/>easily accessible to students and researchers.</p>
                    <div className="hero-subtitle">
                        <Link className={cn(heroStyles['cta-btn'],heroStyles['secondary'],"mr-4")} href="/machines">View Specs</Link>
                        <Link className={heroStyles['cta-btn']} href="/docs">Learn More <span>→</span></Link>
                    </div>
                </div>
                <div className="hero-image">
                    <ServerRackScene />
                </div>
            </div>
            <div className="hero-bg" />
            <style jsx>{`
            .hero {
                position: relative;
                overflow: hidden;
            }
            .hero-bg {
                pointer-events: none;
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 40% 20%, #238aff33, transparent 70%);
            }
            .hero-inner {
                max-width: 90rem;
                padding-left: max(env(safe-area-inset-left),1.5rem);
                padding-right: max(env(safe-area-inset-right),1.5rem);
                margin: 0 auto;
                display: grid;
                gap: 2rem;
                grid-template-columns: 1fr;
                align-items: center;
            }
            @media screen and (min-width: 768px) {
                .hero-inner {
                    grid-template-columns: auto 1fr;
                }
            }
            .hero-title {
                display: inline-block;
                white-space: nowrap;
                font-size: clamp(2.5rem, 5vw, 4.375rem);
                font-weight: 700;
                font-feature-settings: initial;
                letter-spacing: -.12rem;
                margin-left: -0.2rem;
                margin-top: 3.4rem;
                line-height: 1.1;
                background-image: linear-gradient(146deg,#000,#757a7d);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            :global(.dark) .hero-title {
                background-image: linear-gradient(146deg,#fff,#757a7d);
            }
            .hero-subtitle {
                font-size: clamp(1.1rem, 2.5vw, 1.3rem);
                font-feature-settings: initial;
                line-height: 1.6;
                margin-top: 1.5rem;
            }
            .hero-image {
                width: 100%;
                height: clamp(20rem, 40vw, 28rem);
            }
            @media screen and (max-width: 768px) {
                .hero-image {
                    margin-top: 2rem;
                    height: 20rem;
                }
            }
            @media screen and (max-width: 768px) {
                .hero-title {
                font-size: 2.5rem;
                }
            }
            `}</style>
        </div>
    )
}