import {
  getPagesUnderRoute,
} from "nextra/context";
import { Card, Cards } from "nextra/components";
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