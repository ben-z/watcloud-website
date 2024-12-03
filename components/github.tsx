import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Code, Pre } from 'nextra/components';
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from "./ui/input";
import { useMDXComponents } from "nextra-theme-docs";

const usernameToIDFormSchema = z.object({
    username: z.string(),
});

export function UsernameToID() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [warningMessage, setWarningMessage] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [rawData, setRawData] = useState<Object | null>(null);
    const [globalNodeID, setGlobalNodeID] = useState<string>("");

    // Use MDX components from the theme:
    // https://github.com/shuding/nextra/blob/33a2f9a5fe8eb58f78b4b9c8a671bc7f854ea504/packages/nextra-theme-docs/src/mdx-components.tsx#L113
    const components = useMDXComponents();
    const Summary = components.summary ?? "summary";
    const Details = components.details ?? "details";

    const form = useForm<z.infer<typeof usernameToIDFormSchema>>({
        resolver: zodResolver(usernameToIDFormSchema),
        defaultValues: {
            username: "",
        },
    });

    async function onSubmit({ username }: z.infer<typeof usernameToIDFormSchema>) {
        setIsSubmitting(true);
        setWarningMessage("");
        setErrorMessage("");
        setRawData(null);
        setGlobalNodeID("");

        try {
            const encodedUsername = encodeURIComponent(username);
            const reqUrl = `https://api.github.com/users/${encodedUsername}`;
            const reqOptions = {
                headers: {
                    // Explicitly use the new global IDs ("Next ID"):
                    // https://docs.github.com/en/graphql/guides/migrating-graphql-global-node-ids
                    'X-Github-Next-Global-ID': '1'
                }
            }
            const response = await fetch(reqUrl, reqOptions);

            if (!response.ok) {
                throw new Error(`Failed to fetch user "${username}". Status: ${response.status} ${response.statusText}`);
            }

            const headers = Object.fromEntries(response.headers.entries());
            const data = await response.json();

            if (data?.type !== 'User') {
                setWarningMessage(`WARNING: "${username}" does not look like a user. Its type is "${data?.type}". Using the global node ID as a user ID may result in unexpected behavior.`);
            }

            setGlobalNodeID(data.node_id);
            setRawData({
                request: {
                    url: reqUrl,
                    options: reqOptions,
                },
                response: {
                    headers,
                    data,
                }
            });
        } catch (error: any) {
            setErrorMessage(`Error while resolving username: ${error.message}`);
        }
        setIsSubmitting(false);
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input {...field} required />
                                </FormControl>
                                <FormDescription>
                                    Your GitHub username. E.g. <Code>octocat</Code>.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <>Submitting...</> : <>Submit</>}
                    </Button>
                </form>
            </Form>
            {errorMessage && (
                <div className="mt-8">
                    <span className="text-red-500">{errorMessage}</span>
                </div>
            )}
            {warningMessage && (
                <div className="mt-8">
                    <span className="text-yellow-500">{warningMessage}</span>
                </div>
            )}
            {globalNodeID && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold">Global Node ID</h2>
                    <Pre hasCopyCode><Code>{globalNodeID}</Code></Pre>
                </div>
            )}
            {rawData && (
                <Details>
                    <Summary>Raw data</Summary>
                    <div className="mt-2">
                        <Pre hasCopyCode><Code>{JSON.stringify(rawData, null, 2)}</Code></Pre>
                    </div>
                </Details>
            )}
        </>
    );
}