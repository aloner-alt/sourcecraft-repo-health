import { RepositoryTreeProvider } from '../repository-tree.provider';
import { CodeHealthCollector } from './code-health.collector';

describe('CodeHealthCollector', () => {
  it('scores verifiable engineering practices', async () => {
    const tree = { get: jest.fn().mockResolvedValue([
      { name: 'app.spec.ts', path: 'src/app.spec.ts', type: 'file' },
      { name: 'eslint.config.js', path: 'eslint.config.js', type: 'file' },
      { name: '.prettierrc', path: '.prettierrc', type: 'file' },
      { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file' },
    ]) } as unknown as RepositoryTreeProvider;
    await expect(new CodeHealthCollector(tree).collect('team', 'demo')).resolves.toMatchObject({ score: 100 });
  });
});
