declare module 'bcrypt-ts/browser' {
    export function genSaltSync(rounds?: number): string;
    export function hashSync(data: string, salt: string): string;
}
