# Cashier Server

[![Build Status](https://travis-ci.org/sunziping2016/cashier-server.svg?branch=master)](https://travis-ci.org/sunziping2016/cashier-server)
[![codecov](https://codecov.io/gh/sunziping2016/cashier-server/branch/master/graph/badge.svg)](https://codecov.io/gh/sunziping2016/cashier-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

It's the server-side my double-entry accounting system.

## Getting Started

### Prerequisites

First, execute the following commands.

```shell script
git clone git@github.com:sunziping2016/cashier-server.git
cd cashier-server
npm install
cp config/config.example.json config/config.json
cp config/config.example.json config/config.test.json
```

Then, edit `config.json` and `config.test.json` if necessary. They include the
settings for database connections, number of works etc.

### Run Server

Execute the following commands.

```shell script
npm run build
npm run serve
```

### Run Tests

Execute the following commands.

```shell script
npm run test-coverage
```

## Documentation

[Cashier Server - Documentation](https://sunziping2016.github.io/cashier-server/0.1.0/)

## Authors

- Ziping Sun

## License

This project is licensed under the MIT License - see the `LICENSE` file for
details
