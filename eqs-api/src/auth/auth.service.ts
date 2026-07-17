import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      roleID: user.roleId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is unavailable');
    }

    return user;
  }
}
