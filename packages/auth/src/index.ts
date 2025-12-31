import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthContext, UserRole } from '@saas-billing/shared-types';

interface CognitoToken {
  sub: string;
  email: string;
  'cognito:groups'?: string[];
  'custom:tenantId'?: string;
}

export class AuthService {
  private verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(
    private userPoolId: string,
    private clientId: string,
    private region: string = 'us-east-1'
  ) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: 'access',
      clientId: this.clientId,
    });
  }

  async verifyToken(token: string): Promise<AuthContext> {
    try {
      const payload = (await this.verifier.verify(token)) as unknown as CognitoToken;

      return {
        userId: payload.sub,
        email: payload.email,
        tenantId: payload['custom:tenantId'] || '',
        role: this.mapRole(payload['cognito:groups']),
      };
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  private mapRole(groups?: string[]): UserRole {
    if (!groups || groups.length === 0) return UserRole.MEMBER;

    if (groups.includes('admin')) return UserRole.ADMIN;
    if (groups.includes('billing')) return UserRole.BILLING;

    return UserRole.MEMBER;
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}

export async function createAuthContext(
  authHeader: string | undefined,
  authService: AuthService
): Promise<AuthContext | null> {
  // For local development without Cognito, create a mock context
  const skipAuth = process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development';
  
  if (skipAuth) {
    console.log('🔓 Auth bypass enabled - using mock credentials');
    return {
      userId: 'user_demo_456',
      email: 'demo@example.com',
      tenantId: 'tenant_demo_123',
      role: UserRole.ADMIN,
    };
  }

  const token = authService.extractTokenFromHeader(authHeader);
  if (!token) return null;

  try {
    return await authService.verifyToken(token);
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function requireAuth(context: AuthContext | null): asserts context is AuthContext {
  if (!context) {
    throw new Error('Unauthorized: No valid authentication context');
  }
}

export function requireRole(context: AuthContext | null, ...allowedRoles: UserRole[]): void {
  requireAuth(context);

  if (!allowedRoles.includes(context.role)) {
    throw new Error(`Forbidden: Required role is one of [${allowedRoles.join(', ')}]`);
  }
}

export function requireTenant(context: AuthContext | null, tenantId: string): void {
  requireAuth(context);

  if (context.tenantId !== tenantId && context.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: Access to this tenant is not allowed');
  }
}
