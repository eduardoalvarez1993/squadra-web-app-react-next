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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
        />
        <div className="alocar-route-dot" aria-hidden="true" />
      </div>
      <strong>Organizando projetos...</strong>
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
        />
        <div className="gestao-funcional-light-beam" aria-hidden="true" />
        <div className="gestao-funcional-route-dot" aria-hidden="true" />
      </div>
      <strong>Reunindo colaboradores…</strong>
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
        />
        <div className="gestao-projeto-bars-v2" aria-hidden="true">
          <span className="gestao-projeto-bar-v2 gestao-projeto-bar-v2-1" />
          <span className="gestao-projeto-bar-v2 gestao-projeto-bar-v2-2" />
          <span className="gestao-projeto-bar-v2 gestao-projeto-bar-v2-3" />
        </div>
      </div>
      <strong>Organizando Projetos</strong>
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="ponto-loading-panel"
          loading="eager"
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
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
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
        />
        <Image
          src={ASSETS.buscandoLupa}
          alt=""
          width={80}
          height={80}
          className="equipe-search-lens"
          loading="eager"
        />
      </div>
      <strong>Buscando equipe…</strong>
    </div>
  );
}
