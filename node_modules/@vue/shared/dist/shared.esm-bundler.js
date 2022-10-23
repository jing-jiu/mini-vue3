const isObject = (value) => typeof value === "object" && value !== null;
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isIntegerKey = (key) => isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

export { hasChanged, hasOwn, isArray, isIntegerKey, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
