import { isObject } from "@vue/shared"
import {
    mutableHandlers,
    shallowReactiveHandlers,
    readonlyHandlers,
    shallowReadonlyHandlers
} from "./baseHandlers"



export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers)
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers)
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
export function createReactiveObject(target, isReadonly: boolean, baseHandlers) {
    if (!isObject(target)) {
        return target
    }

    // 被代理过了就不需要再次代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap

    const exisitProxy = proxyMap.get(target)
    if (exisitProxy) {
        return exisitProxy
    }
    const proxy = new Proxy(target, baseHandlers)
    proxyMap.set(target, proxy)

    return proxy
}
 