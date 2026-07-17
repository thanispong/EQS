import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const studentRole = await this.usersService.findRoleByName('student');

    if (!studentRole) {
      throw new InternalServerErrorException(
        'Student role is not configured',
      );
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    return this.usersService.createStudent({
      email,
      passwordHash,
      displayName: registerDto.displayName.trim(),
      roleId: studentRole.id,
    });
  }
}