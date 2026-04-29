import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { SortingType } from '@/common/enum/sorting-type.enum';

export class PaginatedQueryParamsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  per_page: number = 10;
}

export interface SortParam<T> {
  field: keyof T;
  direction: SortingType;
}

export function parseSortParams<T>(
  value: string,
  allowedFields: ReadonlySet<keyof T>,
): SortParam<T>[] | undefined {
  if (!value) return undefined;

  return value
    .split(',')
    .map((part: string) => part.trim())
    .filter(Boolean)
    .map((part: string) => {
      const [rawField, rawDir] = part.split(':');

      if (!(rawField && rawDir)) {
        throw new BadRequestException(
          `Invalid sort format: "${part}". Expected field:direction`,
        );
      }

      const field = rawField as keyof T;
      const direction = rawDir.toUpperCase() as SortingType;

      if (!allowedFields.has(field)) {
        throw new BadRequestException(`Invalid sort field: "${String(field)}"`);
      }

      if (![SortingType.ASC, SortingType.DESC].includes(direction)) {
        throw new BadRequestException(
          `Invalid sort direction for "${String(field)}": "${rawDir}"`,
        );
      }

      return { field, direction };
    });
}
