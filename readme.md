# `fgs` [![CI](https://github.com/maraisr/fgs/actions/workflows/ci.yml/badge.svg)](https://github.com/maraisr/fgs/actions/workflows/ci.yml)

> `fgs` _or_ **F**etch **G**raphQL **S**chema is a small utility cli to perform an introspection query against a [graphql-config](https://graphql-config.com/) configuration.

## 💡 Features

-   graphql-config multi-project integration
-   relay (rust) aware
-   json/sdl output

## ⚙️ Install

```sh
npm install fgs
```

## 🚀 Usage

```sh
# fetch schema for endpoint `next`
$ fgs

# fetch schema for endpoint `my-env`
$ fgs --endpoint my-env

# fetch schema into sdl as json
$ fgs --json
```

## License

MIT © [Marais Rossouw](https://marais.io)
