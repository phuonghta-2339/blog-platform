import { PaginationDto } from '@common/dto/pagination.dto';

/**
 * DTO for querying comments list
 * Extends base pagination with optional sorting
 */
export class CommentQueryDto extends PaginationDto {
  // Currently only pagination, can extend with sorting if needed
}
