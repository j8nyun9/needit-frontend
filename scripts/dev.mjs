import { createServer } from 'vite';

// Vite opens Chrome once the development server is ready.
process.env.BROWSER = process.platform === 'darwin' ? 'google chrome' : 'chrome';

try {
  const server = await createServer({
    server: { host: '127.0.0.1', open: true },
  });
  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
} catch (error) {
  console.error('개발 서버를 시작하지 못했습니다:', error);
  process.exitCode = 1;
}