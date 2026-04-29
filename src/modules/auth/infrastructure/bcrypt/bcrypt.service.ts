import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
    this.saltRounds = Number.isFinite(configured) ? (configured as number) : 10;
  }

  getRounds(): number {
    return this.saltRounds;
  }

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}
