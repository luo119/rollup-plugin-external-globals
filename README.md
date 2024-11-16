rollup-plugin-external-globals
==============================

[![test](https://github.com/eight04/rollup-plugin-external-globals/actions/workflows/test.yml/badge.svg)](https://github.com/eight04/rollup-plugin-external-globals/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/eight04/rollup-plugin-external-globals/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/rollup-plugin-external-globals)
[![install size](https://packagephobia.now.sh/badge?p=rollup-plugin-external-globals)](https://packagephobia.now.sh/result?p=rollup-plugin-external-globals)

Transform external imports into global variables like Rollup's `output.globals` option. See [rollup/rollup#2374](https://github.com/rollup/rollup/issues/2374)

Installation
------------

```
npm install -D rollup-plugin-external-globals
```

Usage 1
-----

```js
import externalGlobals from "rollup-plugin-external-globals";

export default {
  input: ["entry.js"],
  output: {
    dir: "dist",
    format: "es"
  },
  plugins: [
    externalGlobals({
      jquery: "$"
    })
  ]
};
```

The above config transforms

```js
import jq from "jquery";

console.log(jq(".test"));
```

into

```js
console.log($(".test"));
```

It also transforms dynamic import:

```js
import("jquery")
  .then($ => {
    $ = $.default || $;
    console.log($(".test"));
  });

// transformed
Promise.resolve($)
  .then($ => {
    $ = $.default || $;
    console.log($(".test"));
  });
```

> **Note:** when using dynamic import, you should notice that in ES module, the resolved object is aways a module namespace, but the global variable might be not.

> **Note:** this plugin only works with import/export syntax. If you are using a module loader transformer e.g. `rollup-plugin-commonjs`, you have to put this plugin *after* the transformer plugin.

Usage 2
-----
```js
import externalGlobals from "rollup-plugin-external-globals";

export default {
  input: ["entry.js"],
  output: {
    dir: "dist",
    format: "es"
  },
  plugins: [
    externalGlobals({
      jquery: {
        name: "$",
        esmUrl: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm"
      }
    })
  ]
};
```

The above config transforms

```js
import jq from "jquery";

console.log(jq(".test"));
```

into

```js
import $ from "https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm";

console.log($(".test"));
```

It also transforms dynamic import:

```js
import("jquery")
  .then($ => {
    $ = $.default || $;
    console.log($(".test"));
  });

// transformed
import("https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm")
  .then($ => {
    $ = $.default || $;
    console.log($(".test"));
  });
```

> **Note:** when using dynamic import, you should notice that in ES module, the resolved object is aways a module namespace, but the global variable might be not.

> **Note:** this plugin only works with import/export syntax. If you are using a module loader transformer e.g. `rollup-plugin-commonjs`, you have to put this plugin *after* the transformer plugin.

API
----

This module exports a single function.

### createPlugin

```js
const plugin = createPlugin(
  globals: Object | Function | {name: String, esmUrl?: String},
  {
    include?: Array,
    exclude?: Array,
    dynamicWrapper?: Function,
    constBindings?: Boolean
  } = {}
);
```

`globals` is a `moduleId`/`variableName` map. For example, to map `jquery` module to `$`:

```js
const globals = {
  jquery: "$"
}
```

or `globals` is a `moduleId`/`variableName and (ESM)CDN URL` map,`(ESM)CDN URL` is optional. For example, to map `jquery` module to `{name: "$", esmUrl: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm"}`:

```js
const globals = {
  jquery: {
    name: "$",
    esmUrl: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm"
    }
}
```

or provide a function that takes the `moduleId` and returns the `variableName`.

```js
const globals = (id) => {
  if (id === "jquery") {
    return "$";
  }
}
```

`include` is an array of glob patterns. If defined, only matched files would be transformed.

`exclude` is an array of glob patterns. Matched files would not be transformed.

`dynamicWrapper` is used to specify dynamic imports. Below is the default.

```js
const dynamicWrapper = (id) => {
  return `Promise.resolve(${id})`;
}
```

Virtual modules are always transformed.

`constBindings` is a boolean. If true, the plugin will use `const` instead of `var` to declare the variable. This usually happens when you try to re-export the global variable. Default is false.

Changelog
---------
* 0.12.2 (Nov 17, 2024)

  - Add: CDN import module function (only supports ESM modules).

* 0.12.1 (Nov 15, 2024)

  - Fix: there is no debug hook in rollup 2.

* 0.12.0 (Aug 11, 2024)

  - Change: throw on export all declaration.
  - Change: define variables with `var`, add `constBindings` option to use `const` instead.
  - Change: resolve identifiers as external.

* 0.11.0 (Jun 27, 2024)

  - Fix: local variable conflict in export declaration.
  - Change: don't throw on parse error.

* 0.10.0 (Apr 5, 2024)

  - Add: `exports` field in package.json to export typescript declaration.

* 0.9.2 (Jan 21, 2024)

  - Fix: support rollup 4.9.6.

* 0.9.1 (Nov 19, 2023)

  - Fix: type declaration.

* 0.9.0 (Oct 28, 2023)

  - **Breaking: bump to rollup@4.**

* 0.8.0 (May 12, 2023)

  - Bump dependencies. Update to magic-string@0.30

* 0.7.2 (mar 9, 2023)

  - Add: typescript declaration.

* 0.7.0 (Nov 21, 2022)

  - **Breaking: bump to rollup@3.**

* 0.6.1 (Oct 21, 2020)

  - Fix: add an extra assignment when exporting globals.

* 0.6.0 (Aug 14, 2020)

  - **Breaking: bump to rollup@2.**

* 0.5.0 (Dec 8, 2019)

  - Add: `dynamicWrapper` option.
  - Add: now `globals` can be a function.
  - Bump dependencies/peer dependencies.

* 0.4.0 (Sep 24, 2019)

  - Add: transform dynamic imports i.e. `import("foo")` => `Promise.resolve(FOO)`.

* 0.3.1 (Jun 6, 2019)

  - Fix: all export-from statements are incorrectly transformed.
  - Bump dependencies.

* 0.3.0 (Mar 25, 2019)

  - Fix: temporary variable name conflicts.
  - **Breaking: transform virtual modules.** Now the plugin transforms proxy modules generated by commonjs plugin.
  - Bump dependencies.

* 0.2.1 (Oct 2, 2018)

  - Fix: don't skip export statement.

* 0.2.0 (Sep 12, 2018)

  - Change: use `transform` hook.
  - Add: rewrite conflicted variable names.
  - Add: handle export from.

* 0.1.0 (Aug 5, 2018)

  - Initial release.
