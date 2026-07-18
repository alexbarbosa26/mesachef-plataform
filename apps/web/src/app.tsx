import { FoundationStatus } from '@mesachef/ui';

const foundations = [
  {
    description: 'React, Vite e TypeScript estrito.',
    label: 'Web independente',
  },
  {
    description: 'Fastify, contratos HTTP e health checks.',
    label: 'API própria',
  },
  {
    description: 'PostgreSQL 14 oficial e SQLite auxiliar.',
    label: 'Persistência isolada',
  },
] as const;

export function App() {
  return (
    <main className="foundation-page">
      <div aria-hidden="true" className="foundation-page__glow" />
      <section aria-labelledby="foundation-title" className="foundation-hero">
        <header className="foundation-hero__header">
          <a aria-label="MesaChef Platform — início" className="brand" href="/">
            <span aria-hidden="true" className="brand__mark">
              M
            </span>
            <span>
              MesaChef
              <small>Platform</small>
            </span>
          </a>
          <FoundationStatus tone="operational">
            Fundação operacional
          </FoundationStatus>
        </header>

        <div className="foundation-hero__content">
          <p className="eyebrow">SPEC 001 · Fundação técnica</p>
          <h1 id="foundation-title">
            Uma base segura para a próxima cozinha digital.
          </h1>
          <p className="foundation-hero__lead">
            O MesaChef Platform está operacional em sua estrutura inicial, com
            aplicações separadas, contratos claros e qualidade verificável.
          </p>
        </div>

        <div aria-label="Componentes da fundação" className="foundation-grid">
          {foundations.map((foundation, index) => (
            <article className="foundation-card" key={foundation.label}>
              <span aria-hidden="true" className="foundation-card__number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2>{foundation.label}</h2>
              <p>{foundation.description}</p>
            </article>
          ))}
        </div>

        <footer className="foundation-hero__footer">
          <span>Monólito modular</span>
          <span aria-hidden="true">·</span>
          <span>Secure by Design</span>
          <span aria-hidden="true">·</span>
          <span>Sem módulos de negócio nesta etapa</span>
        </footer>
      </section>
    </main>
  );
}
