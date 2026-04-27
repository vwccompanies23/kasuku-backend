import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('float')
  monthlyPrice: number;

  @Column('float')
  yearlyPrice: number;

  @Column({ nullable: true })
  stripeYearlyPriceId: string;

  @Column({ nullable: true })
  stripeProductId: string;

  @Column({ nullable: true })
  stripePriceId: string;
}