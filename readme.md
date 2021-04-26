# `fgs` <sup>**F**etch **G**raphQL **S**chema</sup> [![CI](https://github.com/maraisr/fgs/actions/workflows/ci.yml/badge.svg)](https://github.com/maraisr/fgs/actions/workflows/ci.yml)

> A small utility cli to perform an introspection query against a [graphql-config](https://graphql-config.com/) configuration.

## 💡 Features

-   Fast
-   graphql-config multi-project integration
-   relay (rust) aware

## ⚙️ Install

```sh
yarn add fgs
```

## 🚀 Usage

```sh
# fetch schema for endpoint `next`
$ fgs

# fetch schema for endpoint `my-env`
$ fgs --endpoint my-env
```

## License

MIT © [Marais Rossouw](https://marais.io)
