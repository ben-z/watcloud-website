export type Page = {
  route: string;
  name: string;
  meta?: Record<string, unknown>;
  kind?: string;
};
export { getPagesUnderRoute } from 'nextra/context';
