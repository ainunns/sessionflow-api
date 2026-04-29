import { ICollection } from '@/common/interface/presentation/collection.interface';

export interface PaginatedResponseDto<T> {
  readonly data: T[];
  readonly meta: {
    readonly page: number;
    readonly per_page: number;
    readonly total: number;
    readonly max_pages: number;
  };
}

export const toPaginatedResponseDto = <T>(
  data: ICollection<T>,
  page: number,
  perPage: number,
): PaginatedResponseDto<T> => {
  const maxPages = Math.ceil(data.total / perPage);

  return {
    data: data.items,
    meta: {
      page,
      per_page: perPage,
      total: data.total,
      max_pages: maxPages,
    },
  };
};
