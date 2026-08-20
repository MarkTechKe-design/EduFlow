# EduFlow architecture

EduFlow is one Laravel application with an Inertia.js React frontend. The repository is intentionally not split into separate frontend/ and backend/ applications.

## Backend

- app/ contains Laravel application code: controllers, middleware, requests, models, policies, services, jobs, providers, and supporting contracts/scopes/traits.
- bootstrap/ contains Laravel bootstrap and provider registration.
- config/ contains Laravel configuration.
- database/ contains migrations, factories, and seeders.
- routes/ contains HTTP and console route definitions.

## Frontend

- resources/js/Pages/ contains Inertia page components. Page names returned by controllers map to this directory through resources/js/app.tsx.
- resources/js/Layouts/ contains application layouts.
- resources/js/components/ contains reusable React components, including ui/, dashboard/, and layout/.
- resources/js/lib/, Stores/, and Types/ contain frontend utilities, client state, and TypeScript types.
- resources/css/ contains frontend styles.
- resources/js/app.tsx is the Vite/Inertia React entrypoint; bootstrap.js initializes the shared Axios client.

## Request and page flow

Laravel routes dispatch to controllers. Controllers return Inertia responses such as Inertia::render('SchoolAdmin/Students/Index'). The React entrypoint resolves that name from resources/js/Pages/, then renders the page and its reusable components.

## Public, runtime, tests, and documentation

- public/ contains public files and generated Vite assets under public/build/; generated assets are not edited manually.
- storage/ contains Laravel runtime data, logs, cache, and compiled views.
- tests/ contains feature and unit tests.
- docs/ contains project documentation and audits.

Build dependencies are declared in package.json; vite.config.ts connects Laravel Vite, React, Tailwind, and the @ alias to resources/js. Backend dependencies and autoloading remain defined by composer.json.
