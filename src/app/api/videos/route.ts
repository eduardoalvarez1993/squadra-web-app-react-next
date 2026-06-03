import { NextResponse } from 'next/server';

const AIRTABLE_TOKEN = process.env.AIRTABLE_VIDEOS_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_VIDEOS_BASE;

type AirtableRecord = {
  id: string;
  fields: {
    'Link no youtube'?: string;
    'Título do vídeo'?: string;
    'Categoria'?:        string;
    'Thumbnail'?:        string | null;
  };
};

type AirtableResponse = { records: AirtableRecord[] };

export type VideoItem = {
  titulo:     string;
  youtubeId:  string;
  categoria:  string;
};

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export async function GET() {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    return NextResponse.json({ error: 'Airtable não configurado' }, { status: 500 });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/V%C3%ADdeos?view=V%C3%ADdeos`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        Accept:        'application/json',
      },
      next: { revalidate: 3600 }, // cache 1h — Airtable tem rate limit
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[GET /api/videos] Airtable error', res.status, text);
      // Em dev expõe o erro real para facilitar diagnóstico
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ error: `Airtable ${res.status}`, detail: text }, { status: 502 });
      }
      return NextResponse.json({ error: 'Erro ao buscar vídeos' }, { status: 502 });
    }

    const data: AirtableResponse = await res.json();

    // App Xamarin retorna em ordem reversa (mais recentes primeiro)
    const videos: VideoItem[] = [...data.records]
      .reverse()
      .flatMap((rec) => {
        const link      = rec.fields['Link no youtube'] ?? '';
        const titulo    = rec.fields['Título do vídeo'] ?? '';
        const categoria = rec.fields['Categoria'] ?? 'Geral';
        const youtubeId = extractYoutubeId(link);
        if (!youtubeId || !titulo) return [];
        return [{ titulo, youtubeId, categoria }];
      });

    return NextResponse.json(videos);
  } catch (err) {
    console.error('[GET /api/videos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
