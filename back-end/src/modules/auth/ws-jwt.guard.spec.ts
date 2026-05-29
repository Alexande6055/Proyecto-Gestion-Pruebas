import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws-jwt.guard';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const createMockContext = (authorization?: string): ExecutionContext =>
    ({
      switchToWs: () => ({
        getClient: () => ({
          handshake: {
            headers: {
              authorization,
            },
          },
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    guard = new WsJwtGuard(
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );

    jest.clearAllMocks();
  });

  it('debería permitir acceso con token válido', async () => {
    const context = createMockContext('Bearer token-valido');

    mockConfigService.get.mockReturnValue('secret-test');
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      role: 'estudiante',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token-valido', {
      secret: 'secret-test',
    });
  });

  it('debería lanzar WsException si no hay token', async () => {
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
  });

  it('debería lanzar WsException si el token es inválido', async () => {
    const context = createMockContext('Bearer token-invalido');

    mockConfigService.get.mockReturnValue('secret-test');
    mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
  });
});
