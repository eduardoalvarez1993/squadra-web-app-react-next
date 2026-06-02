import { squadra } from './squadra-client';

/** Fluxo completo de login:
 *  1. POST /v1/autenticacao/login       → token, gestorId, login, cargo
 *  2. GET  /v1/usuarios/{login}         → sqhorasId
 *  3. GET  /v1/pessoa                   → pessoaId, nome, foto
 */
export async function loginUpstream(usuario: string, senha: string) {
  const auth = await squadra.auth.login(usuario, senha);

  const [usuarios, pessoa] = await Promise.allSettled([
    squadra.auth.usuarios(auth.login, auth.token),
    squadra.auth.pessoa(auth.token),
  ]);

  const sqhorasId    = usuarios.status === 'fulfilled' ? usuarios.value.sqhorasId : auth.id;
  const pessoaId     = pessoa.status   === 'fulfilled' ? pessoa.value.pessoaId   : auth.id;
  const nome         = pessoa.status   === 'fulfilled' && pessoa.value.nome ? pessoa.value.nome : auth.nome;
  const foto         = pessoa.status   === 'fulfilled' ? pessoa.value.foto : null;
  const bateRepPessoa = pessoa.status  === 'fulfilled' ? pessoa.value.bateRep : false;

  return {
    token:      auth.token,
    id:         auth.id,       // gestorId (usado para permissões e sqhoras)
    pessoaId,                  // pessoaId (de /v1/pessoa)
    sqhorasId,
    login:      auth.login,
    nome,
    cargo:      auth.cargo,
    foto,
    bateRepPessoa,             // bateRep de /v1/pessoa (fonte primária, igual ao PHP)
  };
}

export async function getPermissoes(gestorId: number, token: string) {
  return squadra.auth.permissoes(gestorId, token);
}
