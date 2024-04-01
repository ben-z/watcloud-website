import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { AffiliationInfo } from "@/lib/data";

export function AffiliationList({
  affiliationInfo,
}: {
  affiliationInfo: AffiliationInfo;
}) {
  return (
    <Command className="my-6">
      <CommandInput placeholder="Find your affiliation..." />
      <CommandList className="h-80">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Affiliations">
          {affiliationInfo.affiliations
            .filter((a) => !a.is_legacy)
            .map((a) => (
              <CommandItem
                key={a.name}
                className="aria-selected:bg-inherit aria-selected:text-accent-inherit"
              >
                {a.name}
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Legacy affiliations">
          {affiliationInfo.affiliations
            .filter((a) => a.is_legacy)
            .map((a) => (
              <CommandItem
                className="aria-selected:bg-inherit aria-selected:text-accent-inherit"
                key={a.name}
              >
                {a.name}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
