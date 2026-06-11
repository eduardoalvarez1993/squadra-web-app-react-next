import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SESSION_SECRET } from './config';

declare module 'iron-session' {
  interface IronSessionData {
    token: string;
    gestorId: number;
    pessoaId: number;
    sqhorasId: number;
    login: string;
    nome: string;
    cargo: string;
    // foto deliberadamente ausente — base64 excede o limite de 4 KB do cookie
    bateRep: boolean;
    permissoes: {
      gerenteFuncional?: boolean;
      perfilDP?: boolean;
      perfilCoordenador?: boolean;
      perfilTI?: boolean;
      perfilMarketing?: boolean;
      bateRep?: boolean;
    };
    simulando?: boolean;
    podeSimular?: boolean;
  }
}

// O token da Squadra (JWT) vale 7 dias (168h) — verificado pelo claim `exp`.
// O cookie precisa acompanhar essa validade; antes estava em 8h (28800s),
// o que deslogava a pessoa muito antes do token expirar. Como o backend NÃO
// emite refresh token (o login só devolve `token`), 7 dias é o teto real da
// sessão — não há como estendê-la além disso sem novo login.
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias, alinhado ao token

const sessionOptions = {
  cookieName: 'squadra-session',
  password: SESSION_SECRET,
  cookieOptions: {
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
  },
};

export type { IronSession };
export type { IronSessionData } from 'iron-session';

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<import('iron-session').IronSessionData>(cookieStore, sessionOptions);
}

export async function clearSession(session: IronSession<import('iron-session').IronSessionData>): Promise<void> {
  session.destroy();
}
