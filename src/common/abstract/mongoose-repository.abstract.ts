import { FilterQuery, Model, type UpdateQuery } from 'mongoose';
import { IBaseEntity } from '@/common/interface/domain/base-entity.interface';
import { IRepository } from '@/common/interface/domain/repository.interface';
import { ICollection } from '@/common/interface/presentation/collection.interface';

export abstract class MongooseRepository<T extends IBaseEntity, P = unknown>
  implements IRepository<T, P>
{
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    const filter = this.withoutDeleted({ id } as FilterQuery<T>);
    return await this.model.findOne(filter).lean<T>().exec();
  }

  async findAll(params: P): Promise<ICollection<T>> {
    const filter = this.withoutDeleted((params ?? {}) as FilterQuery<T>);
    const [items, total] = await Promise.all([
      this.model.find(filter).lean<T[]>().exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async save(entity: T): Promise<T> {
    const saved = await this.model.create(entity);
    return (saved.toObject ? saved.toObject() : saved) as T;
  }

  async update(id: string, props: Partial<T>): Promise<T> {
    const updated = await this.model
      .findOneAndUpdate(this.withoutDeleted({ id } as FilterQuery<T>), props, {
        new: true,
      })
      .lean<T>()
      .exec();

    if (!updated) throw new Error(`Entity not found`);

    return updated as T;
  }

  async delete(id: string): Promise<void> {
    const update = { deleted_at: new Date() } as unknown as UpdateQuery<T>;
    const deleted = await this.model
      .findOneAndUpdate(this.withoutDeleted({ id } as FilterQuery<T>), update)
      .exec();
    if (!deleted) throw new Error(`Entity not found`);
  }

  private withoutDeleted(filter: FilterQuery<T>): FilterQuery<T> {
    if ('deleted_at' in filter) return filter;

    return { ...filter, deleted_at: null } as FilterQuery<T>;
  }
}
