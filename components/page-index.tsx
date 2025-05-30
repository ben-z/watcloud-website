import {
  getPagesUnderRoute,
} from "nextra/context";
import { Cards } from "nextra/components";
import { Card, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected import for Card
import Link from 'next/link';
import { BookMarkedIcon } from "lucide-react";

function PageIndex({
    pageRoot,
}: {
    pageRoot: string;
}) {
    const pages = getPagesUnderRoute(pageRoot);

    return (
        <Cards>
        {
            pages.map((page, i) => {
                // Skip directories with no index page
                // In Nextra v3, an MdxFile (page) doesn't have 'children', a Folder does.
                // 'kind' is no longer a property.
                if ((page as any).children) return null; // If it has children, it's a Folder

                const title = page.meta?.title || page.name;
                const route = page.route;

                return (
                    <Link href={route} key={i} passHref legacyBehavior>
                        <a className="no-underline block h-full">
                            <Card className="h-full hover:border-primary">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookMarkedIcon className="w-5 h-5" />
                                        {title}
                                    </CardTitle>
                                </CardHeader>
                                {/* <CardContent><p>Description or content here...</p></CardContent> */}
                            </Card>
                        </a>
                    </Link>
                );
            })
        }
        </Cards>
    );
}

export default PageIndex;