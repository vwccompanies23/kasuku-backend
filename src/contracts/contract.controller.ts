import { Controller, Post, Get, Req, Body } from '@nestjs/common';
import { ContractService } from './contract.service';

@Controller('contract')
export class ContractController {
  constructor(private service: ContractService) {}

  @Post('agree')
  async agree(@Req() req, @Body() body) {
    const userId = req.user.userId;

    return this.service.agree(
      userId,
      body.fullName,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('me')
  async me(@Req() req) {
    return this.service.hasAgreed(req.user.userId);
  }
}