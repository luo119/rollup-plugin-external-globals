const MagicString = require("magic-string");
const {createFilter} = require("@rollup/pluginutils");

const importToGlobals = require("./lib/import-to-globals");
const defaultDynamicWrapper = id => `Promise.resolve(${id})`;

function isVirtualModule(id) {
  return id.startsWith("\0");
}

function createPlugin(globals, {include, exclude, dynamicWrapper = defaultDynamicWrapper, constBindings = false} = {}) {
  if (!globals) {
    throw new TypeError("Missing mandatory option 'globals'");
  }
  let getName = globals;
  const globalsType = typeof globals;
  const isGlobalsObj = globalsType === "object";
  if (isGlobalsObj) {
    getName = function (name) {
      if (Object.prototype.hasOwnProperty.call(globals, name)) {
        if(!globals[name]){
          throw new TypeError("Missing mandatory option 'globals'");
        }
        else if(globals[name] instanceof Object&&Object.keys(globals[name]).length === 0){
          throw new TypeError("Missing mandatory option 'globals'");
        }
        return globals[name];
      }
      else if(Object.keys(globals).length === 0){
        throw new TypeError("Missing mandatory option 'globals'");
      }
      
    };
  } else if (globalsType !== "function") {
    throw new TypeError(`Unexpected type of 'globals', got '${globalsType}'`);
  }
  const dynamicWrapperType = typeof dynamicWrapper;
  if (dynamicWrapperType !== "function") {
    throw new TypeError(`Unexpected type of 'dynamicWrapper', got '${dynamicWrapperType}'`);
  }
  async function resolveId(importee, _, options) {
    if (isVirtualModule(importee) || options.isEntry) return null;
    const globalName = getName(importee)
    return globalName ? false : null;
  }
  const filter = createFilter(include, exclude);
  return {
    name: "rollup-plugin-external-globals",
    options,
    transform,
  };
  function getDebug(context) {
    return (err, message) => {
      if (context.debug) {
        context.debug({
          message,
          cause: err
        });
      } else if (context.warn) {
        context.warn(message, err.loc ?? err.pos ?? null);
      }
    };
  }
  async function options(rawOptions) {
    const plugins = Array.isArray(rawOptions.plugins)
      ? [...rawOptions.plugins]
      : rawOptions.plugins
        ? [rawOptions.plugins]
        : [];
    plugins.unshift({
      name: 'rollup-plugin-external-globals--resolver',
      resolveId
    });
    return { ...rawOptions, plugins };
  }
  async function transform(code, id) {
    if ((!isVirtualModule(id) && !filter(id)) || (isGlobalsObj && Object.keys(globals).every(id => !code.includes(id)))) {
      return;
    }
    let ast;
    try {
      ast = this.parse(code);
    } catch (err) {
      getDebug(this)(err, `Failed to parse code, skip ${id}`);
      return;
    }
    code = new MagicString(code);
    const isTouched = await importToGlobals({
      ast,
      code,
      getName,
      getDynamicWrapper: dynamicWrapper,
      constBindings
    });
    return isTouched ? {
      code: code.toString(),
      map: code.generateMap()
    } : undefined;
  }
}

module.exports = createPlugin;
