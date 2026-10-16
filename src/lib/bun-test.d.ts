declare module "bun:test" {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  // biome-ignore lint/suspicious/noExplicitAny: minimal test-double typing
  export function expect(actual: any): any;
}
