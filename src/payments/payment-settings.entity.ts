import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PaymentSettings {
  @PrimaryGeneratedColumn()
  id: number;

  // =========================
  // 💳 PAYMENT PROVIDERS
  // =========================
  @Column({ default: 'stripe' })
  activeProvider: string;

  @Column({ nullable: true })
  stripeSecret: string;

  @Column({ nullable: true })
  paypalClientId: string;

  @Column({ nullable: true })
  paypalSecret: string;

  // =========================
  // 💰 SUBSCRIPTION PRICES (NEW)
  // =========================
  @Column({ type: 'float', default: 9.99 })
  monthlyPrice: number;

  @Column({ type: 'float', default: 99.99 })
  yearlyPrice: number;

  // =========================
  // 🎯 PROMOTION SYSTEM (NEW)
  // =========================
  @Column({ nullable: true })
  promoTitle: string;

  @Column({ nullable: true })
  promoImage: string;
}