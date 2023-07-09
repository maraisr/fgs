<div align="left">

<samp>

# fgs

</samp>

**F**etch **G**raphQL **S**chema fetches a remote GraphQL schema to a local file.

<a href="https://npm-stat.com/charts.html?package=fgs">
  <img src="https://badgen.net/npm/dm/fgs?color=black&label=npm%20downloads" alt="js downloads">
</a>
<a href="https://unpkg.com/fgs/index.mjs">
  <img src="https://img.badgesize.io/https://unpkg.com/fgs/index.mjs?compression=gzip&label=gzip&color=black" alt="gzip size" />
</a>
<a href="https://unpkg.com/fgs/index.mjs">
  <img src="https://img.badgesize.io/https://unpkg.com/fgs/index.mjs?compression=brotli&label=brotli&color=black" alt="brotli size" />
</a>

<br>
<br>

<sup>

This is free to use software, but if you do like it, consisder supporting me ❤️

[![sponsor me](https://badgen.net/badge/icon/sponsor?icon=github&label&color=gray)](https://github.com/sponsors/maraisr)
[![buy me a coffee](https://badgen.net/badge/icon/buymeacoffee?icon=buymeacoffee&label&color=gray)](https://www.buymeacoffee.com/marais)

</sup>

</div>

## 💡 Features

-   graphql-config multi-project integration
-   relay (rust) aware
-   json/sdl output

## ⚙️ Install

```sh
npm install fgs
```

## 🚀 Usage

uses [graphql-config](https://graphql-config.com/) to find the schema endpoint

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
