import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.ensureUniqueUserFields(
      createUserDto.username.toLowerCase(),
      createUserDto.email.toLowerCase(),
    );

    const role = await this.findRoleOrFail(createUserDto.roleId);
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const user = this.usersRepository.create({
      username: createUserDto.username.toLowerCase(),
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      role,
      isActive: createUserDto.isActive ?? true,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.findOne(savedUser.id);
  }

  async findAll(queryUsersDto: QueryUsersDto): Promise<User[]> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.username', 'ASC');

    if (queryUsersDto.isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', {
        isActive: queryUsersDto.isActive,
      });
    }

    if (queryUsersDto.roleId) {
      queryBuilder.andWhere('role.id = :roleId', {
        roleId: queryUsersDto.roleId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (
      updateUserDto.username &&
      updateUserDto.username.toLowerCase() !== user.username
    ) {
      await this.ensureUniqueUserFields(
        updateUserDto.username.toLowerCase(),
        updateUserDto.email?.toLowerCase(),
        user.id,
      );
    }

    if (
      updateUserDto.email &&
      updateUserDto.email.toLowerCase() !== user.email
    ) {
      await this.ensureUniqueUserFields(
        updateUserDto.username?.toLowerCase(),
        updateUserDto.email.toLowerCase(),
        user.id,
      );
    }

    if (updateUserDto.roleId) {
      user.role = await this.findRoleOrFail(updateUserDto.roleId);
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    user.username = updateUserDto.username?.toLowerCase() ?? user.username;
    user.email = updateUserDto.email?.toLowerCase() ?? user.email;
    user.isActive = updateUserDto.isActive ?? user.isActive;

    const updatedUser = await this.usersRepository.save(user);

    return this.findOne(updatedUser.id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    await this.usersRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }

  private async findRoleOrFail(roleId: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private async ensureUniqueUserFields(
    username?: string,
    email?: string,
    excludeUserId?: string,
  ): Promise<void> {
    if (username) {
      const existingUsernameUser = await this.usersRepository.findOne({
        where: {
          username,
        },
      });

      if (
        existingUsernameUser &&
        existingUsernameUser.id !== excludeUserId
      ) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email) {
      const existingEmailUser = await this.usersRepository.findOne({
        where: {
          email,
        },
      });

      if (existingEmailUser && existingEmailUser.id !== excludeUserId) {
        throw new ConflictException('Email already exists');
      }
    }
  }
}
