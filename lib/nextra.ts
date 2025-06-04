export type Page = {
  route: string;
  name: string;
  meta?: Record<string, any>;
  kind?: string;
};

// Temporary stub until Nextra v4 export is available
export function getPagesUnderRoute(_route: string): Page[] {
  return [];
}
