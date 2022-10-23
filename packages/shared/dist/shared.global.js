var VueShared = (function (exports) {
    'use strict';

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
    const isFunction = (val) => typeof val === 'function';

    exports.hasChanged = hasChanged;
    exports.hasOwn = hasOwn;
    exports.isArray = isArray;
    exports.isFunction = isFunction;
    exports.isIntegerKey = isIntegerKey;
    exports.isObject = isObject;
    exports.isString = isString;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=shared.global.js.map
