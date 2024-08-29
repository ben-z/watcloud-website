import { allImages } from '@/build/fixtures/images';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { websiteConfig } from '@/lib/data';
import { dayjsTz } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/router';
import { MdxFile } from "nextra";
import { Link } from "nextra-theme-docs";
import { getPagesUnderRoute } from "nextra/context";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Picture from "./picture";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Header and Index derived from https://github.com/vercel/turbo/blob/66196a70d02cddc8899ed1423684b1f716aa310e/docs/pages/blog.mdx
export function BlogHeader() {
    return (
        <div className="max-w-screen-lg mx-auto pt-4 pb-8 border-b border-gray-400 border-opacity-20">
            <h1>
                <span className="font-bold leading-tight lg:text-5xl">Breadcrumbs</span>
            </h1>
            <p className="text-center text-gray-500 dark:text-gray-400 font-space-grotesk">
                A record of the big and small things happening at WATcloud
            </p>
        </div>
    );
}

export function BlogIndex() {
    const { locale = websiteConfig.default_locale } = useRouter()

    const items = getPagesUnderRoute("/blog").map((page) => {
        const frontMatter = (page as MdxFile).frontMatter || {}
        if (frontMatter.hidden) {
            return null
        }

        const { date, timezone } = frontMatter
        const dateObj = date && timezone && dayjsTz(date, timezone).toDate()

        let titleImageComponent;
        if (frontMatter.title_image) {
            const titleImage = allImages[frontMatter.title_image];
            if (!titleImage) {
                throw new Error(`No image found for title_image: ${frontMatter.title_image}`);
            }
            const titleImageAttribution = frontMatter.title_image_attribution;
            if (!titleImageAttribution) {
                throw new Error(`No attribution found for title_image: ${frontMatter.title_image}`);
            }

            titleImageComponent = (
                <Picture
                    image={titleImage}
                    alt={titleImageAttribution}
                    wrapperClassName='ml-4 block'
                    imgClassName='max-h-40 max-w-40 w-40 h-auto object-contain'
                />
            )
        }

        return (
            <div key={page.route} className="flex items-center">
                <div>
                    <Link href={page.route} style={{ color: "inherit", textDecoration: "none" }} className="block font-semibold text-2xl">
                        {page.meta?.title || frontMatter.title || page.name}
                    </Link>
                    <p className="opacity-80" style={{ marginTop: ".5rem" }}>
                        {frontMatter.description}{" "}
                        <span className="inline-block">
                            <Link href={page.route}>{"Read more →"}</Link>
                        </span>
                    </p>
                    {dateObj ? (
                        <p className="opacity-50 text-sm">
                            {/* suppressHydrationWarning is used to prevent warnings due to differing server/client locales */}
                            <time dateTime={dateObj.toISOString()} suppressHydrationWarning>
                                {dateObj.toLocaleDateString(locale, {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </time>
                        </p>
                    ) : null}
                </div>
                <div className="hidden md:block ml-auto">{titleImageComponent}</div>
            </div>
        );
    })

    return <div className="grid gap-y-10 my-16">{items}</div>
}

const subscribeFormSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email.",
    }),
});

export function SubscribeDialog() {

    function subscribe(e: React.MouseEvent<HTMLButtonElement>) {
        // Add your subscribe logic here
        console.log("Subscribed!");
        e.preventDefault();
    }

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertDescription, setAlertDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof subscribeFormSchema>>({
        resolver: zodResolver(subscribeFormSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit({ email }: z.infer<typeof subscribeFormSchema>) {
        setIsSubmitting(true);
        try {
            const res = await fetch(
                "https://mailing-list-gateway.watonomous.ca/sign-up",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, mailing_list: "watcloud-blog-updates@watonomous.ca" }),
                }
            );

            if (res.status === 200) {
                setAlertTitle("Success!");
                setAlertDescription(`Success! Please check your email inbox to confirm your subscription.`);
                form.reset();
            } else {
                setAlertTitle("Error");
                setAlertDescription(`Something went wrong! Error code: ${res.status}. Error message: \`${(await res.text())}\`.`);
            }
        } catch (e) {
            setAlertTitle("Error");
            setAlertDescription(`Something went wrong! Network request failed with error "${e}".`);
        }
        setIsAlertOpen(true);
        setIsSubmitting(false);
    }

    return (
        <div className="py-4 rounded-lg">
            <h2 className="text-lg font-semibold">{"Subscribe to WATcloud's blog"}</h2>
            <p className="text-sm mt-1">{"Get the latest posts delivered right to your inbox. We won't spam you!"}</p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="Email Address" {...field} />
                                </FormControl>
                                <FormMessage>
                                    {form.formState.errors.email?.message}
                                </FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <>Submitting...</> : <>Subscribe</>}
                    </Button>
                </form>
            </Form>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
