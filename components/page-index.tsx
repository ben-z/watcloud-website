import { Cards } from "nextra/components";
import { BookMarkedIcon } from "lucide-react";
import { useConfig } from "nextra-theme-docs";

const { Card } = Cards;

function PageIndex({
    pageRoot,
}: {
    pageRoot: string;
}) {
    const { normalizePagesResult } = useConfig();
    
    // Find pages under the specified route
    const findPagesUnderRoute = (route: string) => {
        const targetDir = normalizePagesResult.docsDirectories
            .find(dir => dir.route === route);
        return targetDir?.children || [];
    };
    
    const pages = findPagesUnderRoute(pageRoot);

    return (
        <Cards>
        {
            pages.map((page, i) => {
                // Skip directories with no index page
                if (page.kind !== "MdxPage") return null;

                const title = page.meta?.title || page.name;
                const route = page.route;

                return (
                    <Card
                        key={i}
                        icon={<BookMarkedIcon />}
                        title={title}
                        href={route}
                    >{null}</Card>
                );
            })
        }
        </Cards>
    );
}

export default PageIndex;