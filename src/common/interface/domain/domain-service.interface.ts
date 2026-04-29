export interface IDomainService<T> {
  execute(): Promise<T>;
}
