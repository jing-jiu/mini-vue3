import { isArray, isObject, hasOwn, isIntegerKey, hasChanged } from "@vue/shared"
import { track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./operators"
import { reactive, readonly } from "./reactive"

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)




/**
 * 
 * @param isReadonly 是否只读
 * @param shallow  是否浅相应
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver)

        if (!isReadonly) {
            // 可写的才收集依赖
            console.log("收集依赖", key);
            track(target, TrackOpTypes.GET, key)
        }
        if (shallow) {
            // 浅响应不用返回代理
            return res
        }
        if (isObject(res)) {
            // 结果是对象 判断对象响应式的状态 进行不同的处理
            return isReadonly ? readonly(res) : reactive(res)
        }
        return res
    }
}

function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key]

        // 判断新增还是修改
        const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)

        const result = Reflect.set(target, key, value, receiver)
        if (!hadKey) {
            // 新增属性
            trigger(target, TriggerOpTypes.ADD, key, value)
        } else if (hasChanged(value, oldValue)) {
            // 修改属性
            trigger(target, TriggerOpTypes.SET, key, value, oldValue)
        }
        return result
    }
}


export const mutableHandlers = {
    get, set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}

export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`)
        return true;
    }
}

export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`)
        return true;
    }
}