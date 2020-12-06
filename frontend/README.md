# DeepKnit Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.8.

## Development

Make sure that you have [NodeJs](https://nodejs.org/) installed. Run `npm install` on the project directory to download
the project dependencies.

### Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change
any of the source files. Make sure that the api of the middleware is available on `http://localhost:8080/api/v1`. The
development server will provide a proxy to avoid CORS issues.

### Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Deployment

The frontend should **never** be deployed using the development server. Instead it needs to be build to generate
compiled HTML, CSS and JavaScript files. These files can then be served by any web server.

### Build

Run `npm build` to build the project. The build artifacts will be stored in the `dist/` directory. 

A build is available in the releases tab of Github.
