import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Follow { // ✅ MUST be EXACTLY "Follow"
  @PrimaryGeneratedColumn()
  id: number;

  // 👤 follower
  @ManyToOne(() => User, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  follower: User;

  // 🎤 artist being followed
  @ManyToOne(() => User, (user) => user.followers, {
    onDelete: 'CASCADE',
  })
  following: User;
}