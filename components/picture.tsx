function getImageFormat(src: string) {
    if (src.endsWith('.avif')) {
        return 'image/avif'
    }
    if (src.endsWith('.webp')) {
        return 'image/webp'
    }
    if (src.endsWith('.png')) {
        return 'image/png'
    }
    if (src.endsWith('.jpg') || src.endsWith('.jpeg')) {
        return 'image/jpeg'
    }
    throw new Error(`Unknown image format: ${src}`)
}

/**
 * Renders an image component with multiple sources and an alt text.
 * This is useful for serving images in multiple formats. For example,
 * you can serve an image in AVIF, WebP, and PNG formats and the browser
 * will choose the best format to use.
 * @param srcs - An array of image source URLs.
 * @param alt - The alternative text for the image.
 * @returns The rendered Picture component.
 */
export default function Picture({
    srcs,
    alt,
}: {
    srcs: string[],
    alt: string,
}) {
    return (
        <picture>
            {srcs.slice(0, -1).map((src, i) => (
                <source key={i} srcSet={src} type={getImageFormat(src)} />
            ))}
            <img src={srcs[srcs.length-1]} alt={alt} />
        </picture>
    )
}