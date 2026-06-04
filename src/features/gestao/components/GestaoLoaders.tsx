import Image from 'next/image';
import { ASSETS } from '@/lib/assets';

// ── Pendências ────────────────────────────────────────────────────────────────

export function PendenciasLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="pendencias-loading-stage">
        <Image
          src={ASSETS.loadingPendencias}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="pendencias-stamp" aria-hidden="true" />
      </div>
      <strong>Verificando pendências…</strong>
    </div>
  );
}

// ── Alocar ────────────────────────────────────────────────────────────────────

export function AlocarLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="alocar-loading-stage">
        <Image
          src={ASSETS.loadingAlocar}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="alocar-route-dot" aria-hidden="true" />
      </div>
      <strong>Carregando projetos…</strong>
    </div>
  );
}

// ── Hora Extra ────────────────────────────────────────────────────────────────

export function GestaoFuncionalLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="gestao-funcional-loading-stage">
        <Image
          src={ASSETS.loadingGestaoFuncional}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="gestao-funcional-route-dot" aria-hidden="true" />
      </div>
      <strong>Carregando colaboradores…</strong>
    </div>
  );
}

export function GestaoProjetoLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="gestao-projeto-loading-stage">
        <Image
          src={ASSETS.loadingGestaoProjeto}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="gestao-projeto-pin-dot" aria-hidden="true" />
      </div>
      <strong>Carregando projetos…</strong>
    </div>
  );
}

export function HoraExtraLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="hora-extra-loading-stage">
        <Image
          src={ASSETS.loadingHoraExtra}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="hora-extra-clock-pivot" aria-hidden="true">
          <div className="hora-extra-clock-hand hora-extra-hour" />
          <div className="hora-extra-clock-hand hora-extra-minute" />
        </div>
        <span className="hora-extra-plus" aria-hidden="true">+</span>
      </div>
      <strong>Buscando horas extras…</strong>
    </div>
  );
}

// ── Apropriação (reutiliza ponto-loading) ─────────────────────────────────────

export function ApropriacaoLoader() {
  return (
    <div className="ponto-loading-wrap">
      <div className="ponto-loading-stage">
        <Image
          src={ASSETS.loadingPonto}
          alt=""
          fill
          className="ponto-loading-panel"
          priority
        />
        <div className="ponto-clock-marker" aria-hidden="true">
          <div className="ponto-clock-hand ponto-clock-hour" />
          <div className="ponto-clock-hand ponto-clock-minute" />
        </div>
      </div>
      <strong>Buscando solicitações…</strong>
    </div>
  );
}

// ── Férias ────────────────────────────────────────────────────────────────────

export function FeriasLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="ferias-loading-stage">
        <Image
          src={ASSETS.loadingFerias}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <div className="ferias-coco" aria-hidden="true" />
      </div>
      <strong>Buscando férias…</strong>
    </div>
  );
}

// ── Abono/Day-off ─────────────────────────────────────────────────────────────

export function AbonoLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="abonos-loading-stage">
        <Image
          src={ASSETS.loadingAbonos}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <span className="abonos-stamp" aria-hidden="true" />
      </div>
      <strong>Buscando abonos…</strong>
    </div>
  );
}

// ── Equipe detalhe: busca ─────────────────────────────────────────────────────

export function EquipeSearchLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="equipe-search-stage">
        <Image
          src={ASSETS.buscandoEquipeBase}
          alt=""
          fill
          className="gestao-loader-img"
          priority
        />
        <Image
          src={ASSETS.buscandoLupa}
          alt=""
          width={80}
          height={80}
          className="equipe-search-lens"
          priority
        />
      </div>
      <strong>Buscando equipe…</strong>
    </div>
  );
}
