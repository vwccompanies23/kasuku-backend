import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('tax')
export class TaxController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ✅ SUBMIT TAX FORM
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) return { error: 'User not found' };

    user.taxFullName = body.fullName;
    user.taxCountry = body.country;
    user.taxId = body.taxId;
    user.taxCompleted = true;

    await this.userRepo.save(user);

    return { success: true };
  }

  // 🔥 GET ALL TAX USERS (ADMIN)
  @Get('admin/all')
  async getAll() {
    return this.userRepo.find({
      where: { taxCompleted: true },
      select: [
        'id',
        'email',
        'taxFullName',
        'taxCountry',
        'taxVerified',
      ],
    });
  }

  // 🔥 APPROVE TAX
  @Post('admin/approve')
  async approve(@Body() body: any) {
    const user = await this.userRepo.findOne({
      where: { id: body.userId },
    });

    if (!user) return { error: 'User not found' };

    user.taxVerified = true;

    await this.userRepo.save(user);

    return { success: true };
  }

  // 🔥 REJECT TAX
  @Post('admin/reject')
  async reject(@Body() body: any) {
    const user = await this.userRepo.findOne({
      where: { id: body.userId },
    });

    if (!user) return { error: 'User not found' };

    user.taxCompleted = false;
    user.taxVerified = false;

    await this.userRepo.save(user);

    return { success: true };
  }


  // ✅ CHECK TAX STATUS
  @Post('status')
  @UseGuards(JwtAuthGuard)
  async status(@Req() req: any) {
    const userId = req.user.userId;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    return {
      completed: user?.taxCompleted || false,
      verified: user?.taxVerified || false, // 🔥 EXTRA (useful)
    };
  }
}