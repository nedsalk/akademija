export function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}

export type ArrayOfLength<T, N extends number, R extends T[] = []> = R["length"] extends N
  ? R
  : ArrayOfLength<T, N, [T, ...R]>;
