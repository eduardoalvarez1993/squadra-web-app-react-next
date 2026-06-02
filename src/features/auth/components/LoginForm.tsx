'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

type FormState = { error: string | null; loading: boolean };

export function LoginForm() {
  const router = useRouter();
  const [state,       setState]       = useState<FormState>({ error: null, loading: false });
  const [showSenha,   setShowSenha]   = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ error: null, loading: true });

    const form    = new FormData(e.currentTarget);
    const usuario = form.get('usuario') as string;
    const senha   = form.get('senha')   as string;

    try {
      const res = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario, senha }),
      });

      if (res.ok) {
        router.push('/home');
        router.refresh();
        return;
      }

      if (res.status === 401) {
        setState({ error: 'Usuário ou senha inválidos', loading: false });
        return;
      }

      if (res.status === 429) {
        setState({ error: 'Muitas tentativas. Aguarde e tente novamente.', loading: false });
        return;
      }

      setState({ error: 'Algo deu errado. Tente novamente.', loading: false });
    } catch {
      setState({ error: 'Algo deu errado. Tente novamente.', loading: false });
    }
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '10px 14px',
    border:       '1.5px solid #d1d5db',
    borderRadius: '8px',
    fontSize:     '.95rem',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   'inherit',
    transition:   'border-color .2s',
    background:   '#fff',
  };

  return (
    <form onSubmit={handleSubmit} method="post" className="flex flex-col" style={{ gap: '16px' }}>

      {/* Usuário */}
      <div className="flex flex-col" style={{ gap: '6px' }}>
        <label
          htmlFor="usuario"
          style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151' }}
        >
          Usuário
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          disabled={state.loading}
          placeholder="nome.sobrenome"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#1d4ed8'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#d1d5db'; }}
        />
      </div>

      {/* Senha */}
      <div className="flex flex-col" style={{ gap: '6px' }}>
        <label
          htmlFor="senha"
          style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151' }}
        >
          Senha
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="senha"
            name="senha"
            type={showSenha ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={state.loading}
            placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: '44px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#1d4ed8'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#d1d5db'; }}
          />
          <button
            type="button"
            onClick={() => setShowSenha((v) => !v)}
            aria-pressed={showSenha}
            aria-controls="senha"
            style={{
              position:   'absolute',
              right:      '10px',
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      '#9ca3af',
              padding:    '4px',
              display:    'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
          >
            <span aria-hidden="true">{showSenha ? <EyeOff size={18} /> : <Eye size={18} />}</span>
            <span className="sr-only">{showSenha ? 'Ocultar senha' : 'Mostrar senha'}</span>
          </button>
        </div>
      </div>

      {/* Erro */}
      {state.error && (
        <p role="alert" style={{ color: '#dc2626', fontSize: '.83rem', margin: 0 }}>
          {state.error}
        </p>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={state.loading}
        style={{
          background:    state.loading ? '#93c5fd' : '#1d4ed8',
          color:         '#fff',
          border:        'none',
          borderRadius:  '8px',
          padding:       '12px',
          fontSize:      '1rem',
          fontWeight:    600,
          width:         '100%',
          cursor:        state.loading ? 'not-allowed' : 'pointer',
          transition:    'background .2s',
          fontFamily:    'inherit',
        }}
        onMouseEnter={(e) => { if (!state.loading) e.currentTarget.style.background = '#1e40af'; }}
        onMouseLeave={(e) => { if (!state.loading) e.currentTarget.style.background = '#1d4ed8'; }}
      >
        {state.loading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
