import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Req,
} from '@nestjs/common';

import { CollaboratorsService } from './collaborators.service';

@Controller('collaborators')
export class CollaboratorsController {
  constructor(
    private readonly collabService: CollaboratorsService,
  ) {}

  @Post('add')
  async add(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;

    return this.collabService.addCollaborator(
      userId,
      body.email,
      Number(body.percent),
    );
  }

  @Delete(':email')
  async remove(@Req() req: any, @Param('email') email: string) {
    const userId = req.user.id;

    return this.collabService.removeCollaborator(
      userId,
      email,
    );
  }
}