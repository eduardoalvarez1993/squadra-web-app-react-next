import { squadra, type PessoaData } from './squadra-client';

export async function getPessoaById(id: number, token: string): Promise<PessoaData> {
  return squadra.pessoas.getById(id, token);
}

export async function buscarPessoas(nome: string, token: string): Promise<PessoaData[]> {
  return squadra.pessoas.buscar({ nome }, token);
}
