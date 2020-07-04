[![Travis (.com)](https://img.shields.io/travis/com/elviswolcott/stockfish-native?logo=travis)](https://travis-ci.com/elviswolcott/stockfish-native)
[![npm](https://img.shields.io/npm/v/stockfish-native?label=stockfish-native&logo=npm)](https://www.npmjs.com/package/stockfish-native)
# stockfish-native

> UCI interface for native Stockfish

# Installation

```bash
npm install stockfish-native
```

Download or build the [Stockfish](https://stockfishchess.org/download/) engine from source.
If necessary, mark the binary as executable.

# Development

## Available Scripts

In the project directory, you can run:

### `npm run build`

Builds the package using typescript into `./lib`

### `npm test`

Launches the Jest to run tests.

### `npm run lint`

Checks code for style issues and syntax errors with TSLint and Prettier.

### `npm run lint:fix`

Checks code for style issues and syntax errors with TSLint and Prettier, attempting to fix them when possible.

## Publishing a new version

Travis is configured to run deploys on tags.
