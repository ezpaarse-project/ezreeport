interface DropAddEvent<Element, Index> {
  added: {
    newIndex: Index,
    element: Element,
  },
}
interface DropRemoveEvent<Element, Index> {
  removed: {
    oldIndex: Index,
    element: Element,
  }
}
interface DropMovedEvent<Element, Index> {
  moved: {
    newIndex: Index,
    oldIndex: Index,
    element: Element,
  }
}

type DroppedEvent<Element, Index = number> =
  | DropAddEvent<Element, Index>
  | DropRemoveEvent<Element, Index>
  | DropMovedEvent<Element, Index>;
