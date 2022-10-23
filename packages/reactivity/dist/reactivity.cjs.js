'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

function effect(fn, options = {}) {
    const _effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        _effect();
    }
    return _effect;
}
let uid = 0, effectStack = [], activeEffect = undefined;
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) {
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            }
            finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    effect.id = uid++;
    effect.isEffect = true;
    effect.raw = fn; // 记录原本的fn
    effect.deps = []; // 收集依赖
    effect.options = options;
    return effect;
}
const targetMap = new WeakMap();
function track(target, type, key) {
    // 没有调用effect 就不用记录
    if (activeEffect === undefined) {
        return;
    }
    // 创建收集依赖的map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set));
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const effects = new Set();
    const add = (effectToAdd) => {
        if (effectToAdd) {
            effectToAdd.forEach(effect => {
                effects.add(effect);
            });
        }
    };
    // 如果修改的是数组的length
    if (key === "length" && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key === "length" || key >= newValue) {
                // 更改的长度小于收集的索引 
                add(dep);
            }
        });
    }
    else {
        if (key !== void 0) {
            add(depsMap.get(key));
        }
        /**
         * let arr = [1,2,3]
         * 收集 0,1,2,length
         * arr[3] = 4
         * 需要收集索引3 但是显然上面不会收集到需要做其他处理
         */
        switch (type) {
            // 上述情况会触发length 所以触发length的更新
            case "add" /* TriggerOpTypes.ADD */:
                if (isArray(target) && isIntegerKey(key)) {
                    // 给数组新增书属性 触发length
                    add(depsMap.get("length"));
                }
                break;
        }
    }
    effects.forEach((effect) => {
        effect();
    });
}

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
/**
 *
 * @param isReadonly 是否只读
 * @param shallow  是否浅相应
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 可写的才收集依赖
            console.log("收集依赖", key);
            track(target, "get" /* TrackOpTypes.GET */, key);
        }
        if (shallow) {
            // 浅响应不用返回代理
            return res;
        }
        if (isObject(res)) {
            // 结果是对象 判断对象响应式的状态 进行不同的处理
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key];
        // 判断新增还是修改
        const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        const result = Reflect.set(target, key, value, receiver);
        if (!hadKey) {
            // 新增属性
            trigger(target, "add" /* TriggerOpTypes.ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            // 修改属性
            trigger(target, "set" /* TriggerOpTypes.SET */, key, value);
        }
        return result;
    };
}
const mutableHandlers = {
    get, set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`);
        return true;
    }
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`);
        return true;
    }
};

function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}
// 是不是只读 是不是深度----> 柯里化
// 一个对象可能被多个代理  深度代理 + 仅读代理
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
/**
 *
 * @param target 拦截的目标
 * @param isReadonly 是不是仅读属性
 * @param baseHandlers 对应的拦截函数
 */
function createReactiveObject(target, isReadonly, baseHandlers) {
    if (!isObject(target)) {
        return target;
    }
    // 被代理过了就不需要再次代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const exisitProxy = proxyMap.get(target);
    if (exisitProxy) {
        return exisitProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
//# sourceMappingURL=reactivity.cjs.js.map
