export interface ICollection<E> {
  items: E[];
  total: number;
}

export const emptyCollection = <E>(): ICollection<E> => ({
  items: [],
  total: 0,
});
