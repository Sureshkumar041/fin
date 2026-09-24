import bcrypt from 'bcryptjs';
import type { User } from '../entities/user.entity';
import { userRepository } from '../repositories/user.repository';
import { isUniqueViolation } from '../utils/db-errors';
import { HttpError } from '../utils/http-error';
import { signToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

const BCRYPT_ROUNDS = 12;

// Hash of a random value. Compared against when the email doesn't exist, so a
// failed login takes the same time either way and doesn't reveal which emails are registered.
const DUMMY_HASH = '$2b$12$d0/rg5pTqZge8VEAEzynlOPVIBIN0BCuZmYCuEsfGoUoZZ8/NH63i';

// The only user shape that leaves the API. Never includes passwordHash.
export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'createdAt'>;

function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    let user: User;
    try {
      user = await userRepository.create({ name: input.name, email: input.email, passwordHash });
    } catch (err) {
      // Relying on the unique constraint (instead of checking first) also covers
      // two sign-ups with the same email arriving at the same time.
      if (isUniqueViolation(err)) {
        throw new HttpError(409, 'Email is already registered');
      }
      throw err;
    }

    return { user: toPublicUser(user), token: signToken(user.id) };
  },

  async login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
    const user = await userRepository.findByEmailWithPassword(input.email);
    const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

    // Same message for "no such email" and "wrong password".
    if (!user || !passwordMatches) {
      throw new HttpError(401, 'Invalid email or password');
    }

    return { user: toPublicUser(user), token: signToken(user.id) };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      // Valid token, but the account has since been deleted.
      throw new HttpError(401, 'Not authenticated');
    }
    return toPublicUser(user);
  },
};
