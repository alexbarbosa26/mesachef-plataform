import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './app.js';

describe('MesaChef foundation page', () => {
  it('communicates that the technical foundation is operational', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Fundação operacional');
    expect(markup).toContain('MesaChef Platform está operacional');
    expect(markup).toContain('Sem módulos de negócio nesta etapa');
  });
});
