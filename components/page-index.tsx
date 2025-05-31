import {
  getPagesUnderRoute,
} from "nextra/context";
import { Cards } from "nextra/components";
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
                // Skip directories with no index page - check if page has a route property
                if (!page.route || page.route.endsWith('/')) return null;

                const title = page.meta?.title || page.name;
                const route = page.route;

                return (
                    <Cards.Card
                        key={i}
                        icon={<BookMarkedIcon />}
                        title={title}
                        href={route}
                    />
                );
            })
        }
        </Cards>
    );
}

export default PageIndex;