import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('registration endpoint is declared and auth router is mounted', async () => {
  const [authRoutes, app] = await Promise.all([
    read('./src/routes/auth.routes.js'),
    read('./src/app.js')
  ]);
  assert.match(authRoutes, /router\.post\('\/register'/);
  assert.match(app, /app\.use\('\/api\/auth',\s*authRoutes\)/);
});

test('backend development command is a single Node process without watcher tooling', async () => {
  const pkg = JSON.parse(await read('./package.json'));
  assert.equal(pkg.scripts.dev, 'node src/index.js');
  assert.equal(pkg.scripts.start, 'node src/index.js');
  assert.equal(pkg.dependencies.vite, undefined);
  assert.equal(pkg.dependencies.nodemon, undefined);
});

test('backend defaults to port 3000 and frontend origin 5173', async () => {
  const [envConfig, envExample] = await Promise.all([
    read('./src/config/env.js'),
    read('./.env.example')
  ]);
  assert.match(envExample, /^PORT=3000$/m);
  assert.match(envExample, /^FRONTEND_ORIGIN=http:\/\/localhost:5173$/m);
  assert.match(envConfig, /process\.env\.PORT \|\| 3000/);
});

test('link URL validation supports email and phone presets', async () => {
  const routes = await read('./src/routes/profile.routes.js');
  assert.match(routes, /'mailto:'/);
  assert.match(routes, /'tel:'/);
});


test('birthday page creation requires a birth date', async () => {
  const [routes, model, publicRoutes] = await Promise.all([
    read('./src/routes/birthday.routes.js'),
    read('./src/models/BirthdayPage.js'),
    read('./src/routes/public.routes.js')
  ]);
  assert.match(routes, /dateOfBirth: z\.coerce\.date\(\)/);
  assert.match(model, /dateOfBirth: \{ type: Date, required:/);
  assert.match(publicRoutes, /birthdayMonth/);
  assert.match(publicRoutes, /delete payload\.dateOfBirth/);
});

test('quiet session bootstrap avoids unauthorized responses for anonymous visitors', async () => {
  const source = await read('./src/routes/auth.routes.js');
  assert.match(source, /router\.get\('\/session'/);
  assert.match(source, /authenticated: false, user: null/);
});

test('account deletion is delegated and stages a per-user ImageKit folder cleanup', async () => {
  const [route, controller, service, imagekit, worker, model] = await Promise.all([
    read('./src/routes/auth.routes.js'),
    read('./src/controllers/account.controller.js'),
    read('./src/services/account.service.js'),
    read('./src/services/imagekit.js'),
    read('./src/services/mediaCleanupWorker.js'),
    read('./src/models/MediaDeletionJob.js')
  ]);
  assert.match(route, /router\.delete\('\/account',\s*requireAuth,\s*asyncHandler\(deleteAccount\)\)/);
  assert.match(controller, /deleteAccountData\(req\.user\)/);
  assert.match(service, /stageUserFolderDeletion\(ownerId\)/);
  assert.match(service, /RefreshSession\.deleteMany/);
  assert.match(service, /BirthdayPage\.deleteMany/);
  assert.match(imagekit, /DELETE/);
  assert.match(imagekit, /https:\/\/api\.imagekit\.io\/v1\/folder\//);
  assert.match(imagekit, /`\/pagemint\/\$\{id\}\/`/);
  assert.match(worker, /deleteImageKitFolder\(job\.folderPath\)/);
  assert.match(worker, /User\.exists\(\{ _id: job\.ownerId \}\)/);
  assert.match(model, /user-folder/);
});


test('profile pages can be published and unpublished by their owner', async () => {
  const [model, routes, publicRoutes] = await Promise.all([
    read('./src/models/User.js'),
    read('./src/routes/profile.routes.js'),
    read('./src/routes/public.routes.js')
  ]);
  assert.match(model, /published: \{ type: Boolean, default: true \}/);
  assert.match(routes, /published: z\.boolean\(\)\.optional\(\)/);
  assert.match(publicRoutes, /'profile\.published': \{ \$ne: false \}/);
  assert.match(publicRoutes, /Cache-Control', 'no-store'/);
});
