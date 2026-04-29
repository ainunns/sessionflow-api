import { ICollection } from '@/common/interface/presentation/collection.interface';

export interface IRepository<T, P = unknown> {
  findById(id: string): Promise<T | null>;
  findAll(params: P): Promise<ICollection<T>>;
  save(entity: T): Promise<T>;
  update(id: string, props: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
