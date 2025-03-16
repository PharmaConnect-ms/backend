import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(createUserDto : CreateUserDto): Promise<User> {
    const { username, email ,  password, role , provider } = createUserDto;

    if(!email ) {
      throw new Error('Invalid input');
    }

    if(provider === 'google') {
      const password = null;
      const user = this.usersRepository.create({ username, email, role, provider });
      return this.usersRepository.save(user);
    }else{
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.usersRepository.create({ username, email, password: hashedPassword, role, provider });
      return this.usersRepository.save(user);
    }

    //const user = this.usersRepository.create({ username, password: hashedPassword, role });
    //return this.usersRepository.save(user);
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findall() {
    return this.usersRepository.find();
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

}
