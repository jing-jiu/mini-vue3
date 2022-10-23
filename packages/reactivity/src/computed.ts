import { isFunction } from "@vue/shared";
import { effect, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";


/**
 * 
 * @param getterOrOptions 
 * 1.接受一个 getter 函数，返回一个只读的响应式 ref 对象。该 ref 通过 .value 暴露 getter 函数的返回值。
 * 2.它也可以接受一个带有 get 和 set 函数的对象来创建一个可写的 ref 对象。
 */

class ComputedRefImpl {
    private _value
    private _dirty = true // 默认脏值
    public readonly effect;
    public readonly _v_isRef = true
    constructor(getter, private readonly _setter) {
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    // 依赖属性变化时 标记为脏值触发视图更新
                    this._dirty = true
                    trigger(this, TriggerOpTypes.SET, "value")
                }
            }
        })
    }

    get value() {
        if (this._dirty) {
            // 脏值为true 触发更新 执行effect
            this._value = this.effect()
            this._dirty = false
        }
        track(this, TrackOpTypes.GET
            , "value")
        return this._value
    }

    set value(newVal) {
        this._setter(newVal)
    }

}

export function computed(getterOrOptions) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions
        setter = () => {
            console.warn('computed value is readonly')
        }
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    return new ComputedRefImpl(getter, setter)
}