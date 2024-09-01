import { allImages } from '@/build/fixtures/images';
import CommentSection from '@/components/giscus-comments';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { userProfiles, websiteConfig } from '@/lib/data';
import { cn, dayjsTz } from '@/lib/utils';
import { GithubIcon, LinkIcon, LinkedinIcon, MailIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { Link, useConfig } from "nextra-theme-docs";
import React from 'react';
import { SubscribeDialog } from './blog';
import Picture from './picture';
import { Separator } from './ui/separator';

// Reference for styling: https://github.com/vercel/turbo/blob/22585c9dcc23eb010ab01f177394358af03210d7/docs/pages/blog/turbo-1-10-0.mdx

// Derived from https://github.com/vercel/turbo/blob/22585c9dcc23eb010ab01f177394358af03210d7/docs/components/blog/Date.tsx
function Date({
    children,
}: {
    children: React.ReactNode;
    update?: string;
}) {
    return (
        <div className="text-sm mt-2 text-center text-gray-500 dark:text-gray-400">
            {children}
        </div>
    );
}

export function Avatar({ username }: { username: string }) {
    const image = allImages[`user-${username}`];
    if (!image) {
        throw new Error(`No image found for username: ${username}`);
    }
    if (!(username in userProfiles)) {
        throw new Error(`No profile found for username: ${username}`);
    }

    const profile = (userProfiles as any)[username];

    return (
        <div className="flex items-center flex-shrink-0 md:justify-start">
            <div className="w-[32px] h-[32px]">
                <Picture image={image} alt={username} imgClassName="w-full rounded-full" />
            </div>
            <dl className="ml-2 text-sm font-medium leading-4 text-left whitespace-no-wrap">
                <dt className="sr-only">Name</dt>
                <dd className="text-gray-800 dark:text-slate-50">{profile.watcloud_public_profile.full_name}</dd>
                {profile.watcloud_public_profile.links && profile.watcloud_public_profile.links.map((link: string) => {
                    const iconSize = 16;
                    let icon = <LinkIcon size={iconSize} />;
                    let sr = "link";
                    if (link.startsWith("mailto:")) {
                        icon = <MailIcon size={iconSize} />;
                        sr = "email";
                    } else if (link.startsWith("https://github.com")) {
                        icon = <GithubIcon size={iconSize} />;
                        sr = "github";
                    } else if (link.startsWith("https://linkedin.com")) {
                        icon = <LinkedinIcon size={iconSize} />;
                        sr = "linkedin";
                    } else if (link.startsWith("https://twitter.com") || link.startsWith("https://x.com")) {
                        icon = <XIcon size={iconSize} />;
                        sr = "twitter";
                    }
                    return (
                        <>
                            <dt className="sr-only">{sr}</dt>
                            <dd className="inline-block">
                                <Link
                                    className="text-xs hover:text-gray-900 dark:hover:text-white"
                                    href={link}
                                    target="_blank"
                                >
                                    {icon}
                                </Link>
                            </dd>
                        </>
                    )
                })}
            </dl>
        </div>
    );
}

export function BlogPostHeader() {
    const { frontMatter } = useConfig();

    const { title, date, timezone, authors, reviewers } = frontMatter;
    const { locale = websiteConfig.default_locale } = useRouter()
    const dateObj = date && timezone && dayjsTz(date, timezone).toDate()

    let titleImageComponent;
    if (frontMatter.title_image) {
        // prefer wide image, fallback to square
        const titleImageKey = frontMatter.title_image.wide || frontMatter.title_image.square;
        const titleImage = allImages[titleImageKey];
        if (!titleImage) {
            throw new Error(`Cannot find image with key: ${titleImageKey}`);
        }
        const titleImageAttribution = frontMatter.title_image.attribution;
        if (!titleImageAttribution) {
            throw new Error(`No attribution found for title_image: ${JSON.stringify(frontMatter.title_image)}`);
        }

        titleImageComponent = (
            <Popover>
                <PopoverTrigger className="block mx-auto my-8">
                    <Picture
                        image={titleImage}
                        alt={titleImageAttribution}
                        imgClassName='h-[33vh] min-h-64 max-h-96 w-auto object-contain'
                    />
                </PopoverTrigger>
                <PopoverContent side='bottom' className="w-96 max-w-full">
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                        {titleImageAttribution}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <>
            {titleImageComponent}
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
            <Date>
                {/* suppressHydrationWarning is used to prevent warnings due to differing server/client locales */}
                <time dateTime={dateObj.toISOString()} suppressHydrationWarning>
                    {dateObj.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </time>
            </Date>
            <div className="w-full border-b border-gray-400 authors border-opacity-20">
                <div className="flex justify-center mt-8 mb-2 mx-auto gap-14">
                    {authors && authors.length > 0 && (
                        <div className="text-center">
                            <div className="flex justify-center mb-2 text-sm text-gray-500 dark:text-gray-400">Written By</div>
                            <div className="flex flex-wrap justify-center mb-8 gap-7">
                                {authors.map((author: string) => (
                                    <Avatar key={author} username={author} />
                                ))}
                            </div>
                        </div>

                    )}
                    {reviewers && reviewers.length > 0 && (
                        <div className="text-center">
                            <div className="flex justify-center mb-2 text-sm text-gray-500 dark:text-gray-400">Reviewed By</div>
                            <div className="flex flex-wrap justify-center mb-8 gap-7">
                                {reviewers.map((reviewer: string) => (
                                    <Avatar key={reviewer} username={reviewer} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export function BlogPostFooter() {
    return <>
        <Separator className="my-8" />
        <SubscribeDialog />
        <Separator className="my-8" />
        <CommentSection />
    </>
}
