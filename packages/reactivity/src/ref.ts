import { hasChanged, isArray, isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { reactive } from "./reactive";


// ref本质就是给基本类型外面包一层
export function ref(value) {
    return createRef(value)
}

function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow)
}

// 通过reactive追加响应式 proxy
const convert = (val) => isObject(val) ? reactive(val) : val

class RefImpl {
    private _value
    public readonly _v_isRef = true

    constructor(private _rawValue, private readonly _shallow) {
        this._value = _shallow ? _rawValue : convert(_rawValue)
    }

    get value() {
        track(this, TrackOpTypes.GET, "value")
        return this._value
    }
    set value(newVal) {
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal // 保存oldValue
            this._value = this._shallow ? newVal : convert(newVal)
            trigger(this, TriggerOpTypes.SET, "value", newVal)
        }
    }
}

class ObjectRefImpl {
    public readonly _v_isRef = true
    constructor(private readonly _object, private readonly _key) {

    }
    get value() {
        return Reflect.get(this._object, this._key)
    }

    set value(newVal) {
        Reflect.set(this._object, this._key, newVal)
    }

}

// 可以结构数据而不失去响应式

// 将对象中的属性转换成ref属性
export function toRef(object, key) {
    return new ObjectRefImpl(object, key)
}
// 将对象转成ref
export function toRefs(object) {
    const ret = isArray(object) ? new Array(object.length) : {}

    for (const key in object) {
        ret[key] = toRef(object, key)
    }
    return ret
}