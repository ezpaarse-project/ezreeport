import type { Command } from '@oclif/core';
import treeify, { type Tree, type Options } from 'object-treeify';

interface SimpleTree {
  readonly nodes: Tree;

  insert(child: string, subtree?: SimpleTree | Tree): Tree;

  display(options?: Options): void;
}

const isSimpleTree = (value: Tree | SimpleTree): value is SimpleTree => typeof value?.insert === 'function';

export const createTree = (command: Command, initial: Tree = {}): SimpleTree => {
  const instance = { ...initial };

  return {
    get nodes() { return instance; },

    display(options: Options = {}): void {
      command.log(treeify(instance, options));
    },

    insert(child: string, subtree?: SimpleTree | Tree): Tree {
      let value = subtree ?? null;
      if (value && isSimpleTree(value)) {
        value = value.nodes;
      }

      instance[child] = value ?? null;
      return instance;
    },
  };
};
