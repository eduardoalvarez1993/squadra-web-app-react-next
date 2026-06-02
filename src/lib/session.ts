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
    temEquipe?: boolean;
  }
}

const sessionOptions = {
  cookieName: 'squadra-session',
  password: SESSION_SECRET,
  cookieOptions: {
    maxAge: 28800,
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
