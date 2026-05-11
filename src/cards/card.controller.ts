// src/cards/card.controller.ts
import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { CardService } from './card.service';

@Controller('billing')
export class CardController {
  constructor(private service: CardService) {}

  @Post('card')
  saveCard(@Req() req, @Body() body) {
    return this.service.saveCard(req.user.userId, body);
  }

  @Get('card')
  getCard(@Req() req) {
    return this.service.getCard(req.user.userId);
  }
}