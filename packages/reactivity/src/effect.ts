import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from "./operators"

export function effect(fn, options: any = {}) {
    const _effect = createReactiveEffect(fn, options)
    if (!options.lazy) {
        _effect()
    }
    return _effect
}

let uid = 0, effectStack = [], activeEffect = undefined
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) {
            try {
                effectStack.push(effect)
                activeEffect = effect
                return fn()
            } finally {
                effectStack.pop()
                activeEffect = effectStack[effectStack.length - 1]
            }
        }
    }
    effect.id = uid++
    effect.isEffect = true
    effect.raw = fn // 记录原本的fn
    effect.deps = [] // 收集依赖
    effect.options = options
    return effect
}

const targetMap = new WeakMap()

export function track(target, type, key) {
    // 没有调用effect 就不用记录
    if (activeEffect === undefined) {
        return
    }
    // 创建收集依赖的map
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map))
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set))
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}

export function trigger(target, type, key?, newValue?, oldValue?) {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }

    const effects = new Set()
    const add = (effectToAdd) => {
        if (effectToAdd) {
            effectToAdd.forEach(effect => {
                effects.add(effect)
            });
        }
    }
    // 如果修改的是数组的length
    if (key === "length" && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key === "length" || key >= newValue) {
                // 更改的长度小于收集的索引 
                add(dep)
            }
        });
    } else {
        if (key !== void 0) {
            add(depsMap.get(key))
        }
        /**
         * let arr = [1,2,3]
         * 收集 0,1,2,length
         * arr[3] = 4
         * 需要收集索引3 但是显然上面不会收集到需要做其他处理 
         */
        switch (type) {
            // 上述情况会触发length 所以触发length的更新
            case TriggerOpTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) {
                    // 给数组新增书属性 触发length
                    add(depsMap.get("length"))
                }
                break;

            default:
                break;
        }
    }
    effects.forEach((effect: any) => {
        effect()
    })
}