// https://github.com/blackflux/object-treeify/issues/1077
declare module 'object-treeify' {
  export type Node = Tree | boolean | string | number | null | undefined;

  export type Tree = {
    [key: string]: Node;
  };

  export type Options = {
    joined?: boolean;
    spacerNoNeighbour?: string;
    spacerNeighbour?: string;
    keyNoNeighbour?: string;
    keyNeighbour?: string;
    separator?: string;
    renderFn?: (node: Node) => boolean | undefined;
    sortFn?: ((a: string, b: string) => number) | null;
    breakCircularWith?: string | null;
  };

  function F(tree: Tree, options?: Options): string;

  export default F;
}
