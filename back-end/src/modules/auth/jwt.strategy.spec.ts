import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService.getOrThrow.mockReturnValue('test-secret');

    strategy = new JwtStrategy(mockConfigService as unknown as ConfigService);
  });

  it('debería estar definido', () => {
    expect(strategy).toBeDefined();
  });

  it('debería obtener JWT_SECRET desde ConfigService', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('debería validar el payload y retornar userId, email y role', async () => {
    const payload = {
      sub: '550e8400-e29b-41d4-a716-446655440001',
      email: 'usuario@uta.edu.ec',
      role: 'estudiante',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it('debería retornar undefined en campos faltantes si el payload viene incompleto', async () => {
    const payload = {
      sub: '550e8400-e29b-41d4-a716-446655440001',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: payload.sub,
      email: undefined,
      role: undefined,
    });
  });
});
