import { Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { AdminAuditInterceptor } from '@/common/audit/admin-audit.interceptor';

/**
 * BullBoard Controller
 * Protected endpoint for email queue monitoring dashboard
 *
 * Security:
 * - Requires valid JWT token (JwtAuthGuard)
 * - Requires ADMIN role (RolesGuard)
 * - All access is logged via AdminAuditInterceptor
 *
 * Access: /admin/queues/ui
 *
 * Note: BullBoard UI is automatically mounted at /admin/queues/ui
 * via BullBoardModule configuration in MailModule.
 * The guards protect the entire /admin/queues/* path including the UI.
 */
@ApiTags('Admin - Queue Management')
@ApiBearerAuth()
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles(Role.ADMIN)
export class BullBoardController {
  // BullBoard handles its own routing via Express middleware
  // All routes under /admin/queues/* are protected by the guards above
  // All access attempts are logged by AdminAuditInterceptor
}
