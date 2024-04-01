// Type definitions for sha512crypt-node

declare module "sha512crypt-node" {
  export function sha512crypt(password: string, salt: string): string;
}
