const { sha256 } = require('js-sha256');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const dedent = require('dedent');
const os = require('os');
const slugify = require('slugify');

const USER_PROFILES_PATH = path.resolve(process.argv[2]);
if (!USER_PROFILES_PATH) {
    console.error("Please provide a path to the user profiles JSON file");
    process.exit(1);
}
if (!fs.existsSync(USER_PROFILES_PATH)) {
    console.error(`User profiles file "${USER_PROFILES_PATH}" does not exist`);
    process.exit(1);
}

const OUTPUT_DIR = process.argv[3];
if (!OUTPUT_DIR) {
    console.error("Please provide an output directory");
    process.exit(1);
}
if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`Output directory "${OUTPUT_DIR}" does not exist`);
    process.exit(1);
}

const CACHE_DIR = process.argv[4] || os.tmpdir();

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(path.join(OUTPUT_DIR, "images"), { recursive: true });

// MARK: Image Helpers

const RESOLVER_URL_PREFIXES = [
    "https://rgw.watonomous.ca/asset-perm",
    "https://rgw.watonomous.ca/asset-off-perm",
    "https://rgw.watonomous.ca/asset-temp",
]

function extractSha256(str) {
    const sha256Match = str.match(/sha256:([a-f0-9]{64})/);
    if (!sha256Match) {
        throw new Error("Invalid string: does not contain a SHA-256 hash.");
    }
    return sha256Match[1];
}

class WATcloudURI extends URL {
    constructor(input) {
        super(input);
        if (this.protocol !== "watcloud:") {
            throw new Error("Invalid WATcloud URI: protocol must be 'watcloud:'");
        }
        if (this.hostname !== "v1") {
            throw new Error(`Invalid WATcloud URI: unsupport version "${this.hostname}". Only 'v1' is supported`);
        }
        this.sha256 = extractSha256(this.pathname);
        if (this.searchParams.has("name")) {
            this.name = this.searchParams.get("name");
        }
    }

    async resolveToURL() {
        const urls = await Promise.all(RESOLVER_URL_PREFIXES.map(async (prefix) => {
            const r = `${prefix}/${this.sha256}`;
            const res = await fetch(r, { method: 'HEAD' });
            if (res.ok) {
                return r;
            }
        }));

        const url = urls.find((url) => url !== undefined);
        if (!url) {
            throw new Error('Asset not found.');
        }

        return url
    }
}

async function processImage(image, preprocessSteps = []) {
    const cacheDir = path.join(CACHE_DIR, `${image.uri.sha256}`);
    const originalPath = path.join(cacheDir, "original");

    if (fs.existsSync(originalPath)) {
        console.log(`Using cached version of ${image.name} (sha256:${image.uri.sha256})`)
    } else {
        await fs.promises.mkdir(cacheDir, { recursive: true });

        const url = await image.uri.resolveToURL();
        console.log(`Downloading and processing ${image.name} from ${url}`);
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const sha256Hash = sha256(buffer);
        if (sha256Hash !== image.uri.sha256) {
            throw new Error(`SHA-256 hash mismatch for "${image.name}"! Expected ${image.uri.sha256}, got ${sha256Hash}`);
        }
        await fs.promises.writeFile(originalPath, Buffer.from(buffer));
    }

    let sharpImage = sharp(originalPath);
    for (const fn of preprocessSteps) {
        sharpImage = await fn(sharpImage);
    }

    // Optimization params derived from:
    // https://github.com/343dev/optimizt/blob/46bec479c26a3e81b83ed1269780506f5a00efb5/.optimiztrc.js
    const avifOptions = image.optimize ? {
        quality: 50, // quality, integer 1-100
        lossless: false, // use lossless compression
        effort: 4, // CPU effort, between 0 (fastest) and 9 (slowest)
        chromaSubsampling: '4:2:0', // set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling
    } : {};
    const avifCacheName = `${image.name}-${slugify(JSON.stringify(avifOptions), { lower: true, strict: true })}.avif`;
    
    const webpOptions = image.optimize ? {
        quality: 50, // quality, integer 1-100
        alphaQuality: 100, // quality of alpha layer, integer 0-100
        lossless: false, // use lossless compression mode
        nearLossless: false, // use near_lossless compression mode
        smartSubsample: false, // use high quality chroma subsampling
        effort: 6, // CPU effort, between 0 (fastest) and 6 (slowest)
        minSize: false, // prevent use of animation key frames to minimise file size (slow)
        mixed: false, // allow mixture of lossy and lossless animation frames (slow)
    } : {};
    const webpCacheName = `${image.name}-${slugify(JSON.stringify(webpOptions), { lower: true, strict: true })}.webp`;
    
    const jpgOptions = image.optimize ? {
        quality: 50, // quality, integer 1-100
        progressive: true, // use progressive (interlace) scan
        optimizeScans: true, // optimise progressive scans, forces progressive
        chromaSubsampling: '4:2:0', // set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling
        optimizeCoding: true, // optimise Huffman coding tables
        mozjpeg: false, // use mozjpeg defaults, equivalent to { trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3 }
        trellisQuantisation: true, // apply trellis quantisation
        overshootDeringing: true, // apply overshoot deringing
        quantizationTable: 3, // quantization table to use, integer 0-8
    } : {};
    const jpgCacheName = `${image.name}-${slugify(JSON.stringify(jpgOptions), { lower: true, strict: true })}.jpg`;

    if (!fs.existsSync(path.join(cacheDir, avifCacheName))) {
        await sharpImage.avif(avifOptions).toFile(path.join(cacheDir, avifCacheName));
    }
    if (!fs.existsSync(path.join(cacheDir, webpCacheName))) {
        await sharpImage.webp(webpOptions).toFile(path.join(cacheDir, webpCacheName));
    }
    if (!fs.existsSync(path.join(cacheDir, jpgCacheName))) {
        await sharpImage.jpeg(jpgOptions).toFile(path.join(cacheDir, jpgCacheName));
    }

    await Promise.all([
        fs.promises.copyFile(path.join(cacheDir, avifCacheName), path.join(OUTPUT_DIR, "images", `${image.name}.avif`)),
        fs.promises.copyFile(path.join(cacheDir, webpCacheName), path.join(OUTPUT_DIR, "images", `${image.name}.webp`)),
        fs.promises.copyFile(path.join(cacheDir, jpgCacheName), path.join(OUTPUT_DIR, "images", `${image.name}.jpg`)),
    ])
}

// Derived from https://stackoverflow.com/a/53952925/4527337
function toPascalCase(string) {
  return `${string}`
    .toLowerCase()
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3}`
    )
    .replace(new RegExp(/\w/), s => s.toUpperCase());
}

function generateTypescript(image_names) {
    const preamble = dedent`
        // This file is automatically generated. Please do not edit.
        import { StaticImageData } from "next/image"

        export type WATcloudStaticImage = {
            avif: StaticImageData,
            webp: StaticImageData,
            jpg: StaticImageData,
        }

        const allImages: Record<string, WATcloudStaticImage> = {};
    `;

    const imageImports = image_names.map((image_name) => {
        const pascalName = toPascalCase(image_name);
        return dedent`
            import ${pascalName}Avif from "./images/${image_name}.avif";
            import ${pascalName}Webp from "./images/${image_name}.webp";
            import ${pascalName}Jpg from "./images/${image_name}.jpg";

            export const ${pascalName}: WATcloudStaticImage = {
                avif: ${pascalName}Avif,
                webp: ${pascalName}Webp,
                jpg: ${pascalName}Jpg,
            };

            allImages["${image_name}"] = ${pascalName};
        `;
    });

    const postamble = dedent`
        export { allImages };
    `;

    const content = [preamble, ...imageImports, postamble].join("\n\n");

    return content;
}

(async () => {
    // MARK: Profile Pictures
    console.log("Processing profile pictures...")
    const USER_PROFILES = require(USER_PROFILES_PATH)

    const user_profile_images = Object.entries(USER_PROFILES).map(([username, profile]) => ({
        name: `user-${username}`,
        uri: new WATcloudURI(profile.watcloud_public_profile.profile_picture)
    }));

    await Promise.all(user_profile_images.map(image => processImage(image, [(sharpImage) => sharpImage.resize(200, 200)])));

    // MARK: Images
    console.log("Processing images...")
    const IMAGES = [
        { name: "cloud-light", uri: new WATcloudURI("watcloud://v1/sha256:906f98c1d660a70a6b36ad14c559a9468fe7712312beba1d24650cc379a62360?name=cloud-light.avif") },
        { name: "cloud-dark", uri: new WATcloudURI("watcloud://v1/sha256:578d058bc16d5b52e93cc14f0d28ac0b4cf0a6e93b85db4a2c82a497ef43dc36?name=cloud-dark.avif") },
        { name: "robot-light", uri: new WATcloudURI("watcloud://v1/sha256:439c9475cfe2202bbdf09dd60cd604564562ad2a2900c7b1c8eb6f392b961696?name=robot-light.avif") },
        { name: "robot-dark", uri: new WATcloudURI("watcloud://v1/sha256:9490ceb060e2b58bd5235fe7351875ac7bb04791c0cdcbf35db364257e8ccd8d?name=robot-dark.avif") },
        { name: "computer-light", uri: new WATcloudURI("watcloud://v1/sha256:3453358de2456b805229ba30ebc48a74f1e9eb7c8fbf3176927c60bbf99c69cc?name=computer-light.avif") },
        { name: "computer-dark", uri: new WATcloudURI("watcloud://v1/sha256:7dac34046e20b4a5c4982d2a7940fdb313687d030b72a297adcd2a84d138e099?name=computer-dark.avif") },
        { name: "server-room-light", uri: new WATcloudURI("watcloud://v1/sha256:c3b72b5fb4c7bdff14f293782a98d7b1a21c7f2d6479cb1fa3b1b196a2179f73?name=server-room-light-min.jpg"), optimize: true},
        { name: "server-room-dark", uri: new WATcloudURI("watcloud://v1/sha256:216ca4fdc626b94daaad8a63be5c1a507f82abb2b3bed1839f6d0996ac3e84d2?name=server-room-dark-min.jpg"), optimize: true},
        { name: "doc-proxmox-primary-gpu", uri: new WATcloudURI("watcloud://v1/sha256:9b7b398205cf6508dce29f07023001baf5eebc287780d7220f50c6965da809ac?name=doc-proxmox-primary-gpu.png"), optimize: true},
    ];
    await Promise.all(IMAGES.map(image => processImage(image)));

    // MARK: Generate images.ts
    const tsContent = generateTypescript([...user_profile_images, ...IMAGES].map((image) => image.name));
    await fs.promises.writeFile(path.join(OUTPUT_DIR, "images.ts"), tsContent);

    console.log("Assets generated successfully");
})().catch((err) => {
    console.error(err);
    process.exit(1);
});