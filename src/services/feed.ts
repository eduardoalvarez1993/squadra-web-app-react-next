import { squadra, type Post, type Comentario, type Comunicado } from './squadra-client';

export async function getPosts(offset: number, token: string): Promise<Post[]> {
  return squadra.feed.getPosts(offset, token);
}

export async function getComunicados(token: string): Promise<Comunicado[]> {
  return squadra.feed.getComunicados(token);
}

export async function getComentarios(postId: number, token: string): Promise<Comentario[]> {
  return squadra.feed.getComentarios(postId, token);
}

export async function criarPost(payload: {
  pessoaId:        number;
  destinatarioId:  number;
  tipoPublicacao:  string;
  texto:           string;
}, token: string): Promise<{ ok: true }> {
  return squadra.feed.criarPost({
    remetente:      payload.pessoaId,
    destinatario:   payload.destinatarioId,
    tipoPublicacao: payload.tipoPublicacao,
    descricao:      payload.texto,
    mensagem:       payload.texto,
    objetivo:       'Outros',
  }, token);
}

export async function addLike(postId: number, gestorId: number, token: string): Promise<{ ok: true }> {
  return squadra.feed.addLike(postId, gestorId, token);
}

export async function removeLike(postId: number, gestorId: number, token: string): Promise<{ ok: true }> {
  return squadra.feed.removeLike(postId, gestorId, token);
}

export async function comentar(postId: number, texto: string, autorId: number, token: string): Promise<{ ok: true }> {
  return squadra.feed.comentar(postId, texto, autorId, token);
}

export async function deletarPost(postId: number, token: string): Promise<{ ok: true }> {
  return squadra.feed.deletarPost(postId, token);
}

export async function deletarComentario(comentarioId: number, token: string): Promise<{ ok: true }> {
  return squadra.feed.deletarComentario(comentarioId, token);
}
