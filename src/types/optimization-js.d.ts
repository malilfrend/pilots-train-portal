declare module 'optimization-js' {
  export function minimize_Powell(
    f: (x: number[]) => number,
    x0: number[]
  ): { argument: number[]; fncvalue: number }
}
