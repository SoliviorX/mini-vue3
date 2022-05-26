const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
    };
    // 用 或运算符 进行shapeFlag的合并，来设置children类型
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 如果vnode类型是component，同时children类型为对象，则children为插槽，设置shapeFlag 对应的位
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
// 根据vnode.type设置初始的vnode.shapeFlag
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

/**
 * 1. 当slots是一个数组时，在子组件中接收this.$slots需要进行处理：h('div', {}, [garandSon, this.$slots])，组件的children不能是嵌套数组，所以需要对this.$slots进行处理。
 * 2. 把this.$slots展开放入children中也行啊，还可以少一层div包裹，为何不这样处理？？？？
 */
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        // 如果是作用域插槽
        if (typeof slot === 'function') {
            return slot(props);
        }
        else {
            // 如果是默认插槽/具名插槽
            return createVNode(Fragment, {}, slot);
        }
    }
}

const extend = Object.assign;
const isObject = val => {
    return val !== null && typeof val === 'object';
};
const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// 转换为驼峰格式
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// 将首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

let activeEffect;
let shouldTrack;
/**
 * 创建effect时，首次会自动执行fn
 * 所以可以考虑使用class的方式实现effect
 */
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        /**
         * 1. 先把shouldTrack设为true，当执行下面的_fn时，就会进行依赖收集，fn执行完再把shouldTrack设为false
         * 2. 只有在初始化effect实例、触发更新和手动执行runner时才会执行 run()
         * 3. 也就是说在重新获取数据，触发数据的get时，不会执行run，shouldTrack为false，不会重新进行依赖收集
         * 4. 所以当执行obj.foo++ 重新触发get时，由于shouldTrack为false，不会重新进行依赖收集
         */
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        // 某effect的stop执行过后，不再重复执行，优化性能
        if (this.active) {
            // 在所有的dep中删除该effect
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // deps中每个dep都把该effect删除
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 再把该effect.deps清空
    effect.deps.length = 0;
}
// 依赖收集；每个key对应一个独一无二的dep，在dep中收集activeEffect
const targetMap = new Map();
/**
 * targetMap的结构及对应的类型和名称：
 * targetMap<Map> {
        target1<Map> : depsMap-{
            key1<Set>: dep-[activeEffect],
            key2<Set>: dep-[activeEffect],
        },
        target2<Map> : depsMap-{
            key1<Set>: dep-[activeEffect]
        },
    }
*/
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trackEffects(dep) {
    // 不重复收集
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向收集
    activeEffect.deps.push(dep);
}
// 触发更新：获取到dep收集的所有effect，执行effect里面的回调
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 方式一：_effect.onStop = options.onStop
    // 方式二：Object.assign(_effect, options);
    // 方式三：export extend = Object.assign，然后使用extend来扩展_effect，更具可读性。
    extend(_effect, options);
    _effect.run();
    // 返回runner，并将指针绑定为effect实例
    const runner = _effect.run.bind(_effect);
    // 在runner上新增一个effect属性，值为effect实例
    runner.effect = _effect;
    return runner;
}

function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 如果是shallow类型，直接return，不进行后续的递归readonly处理以及依赖收集
        if (shallow) {
            return res;
        }
        // 【深层属性的处理】**************
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // isReadonly属性不进行依赖收集
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖更新
        trigger(target, key);
        return res;
    };
}
// 优化：将创建getter、setter缓存起来，而不是每次调用reactive/readonly都创建新的getter函数/setter函数
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败，因为 ${target} 是readonly。`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

const initSlots = (instance, children) => {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
};
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
// 遍历 children，将其 property 对应的 VNode 数组挂载到 slots 对象上
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        if (typeof value === 'function') {
            // 如果是作用域插槽
            slots[key] = props => normalizeSlotValue(value(props));
        }
        else {
            // 如果是具名插槽/默认插槽（key是default）
            slots[key] = normalizeSlotValue(value);
        }
    }
}

// implement：实现
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        /**
         * 1. 取值的时候判断value是否是对象，是对象的话就用reactive进行包裹，否则直接取值
         * 2. 将原始值存起来，方便后边修改的时候对比新旧值
         */
        this._rawValue = value;
        this._value = convert(value);
        // Set 类型保证dep不会重复收集依赖
        this.dep = new Set();
    }
    // 所有ref的数据都是通过value属性获取到它的值，所以都会走到get value()这一步；在get中进行依赖收集。
    // reactive依赖收集时会创建targetMap，targetMap中每个target对应一个depsMap，depsMap中每个key对应一个dep；
    // ref只有一个key（就是value属性），只在实例化RefImpl时，才会往实例上添加一个dep来收集依赖。
    get value() {
        if (isTracking()) {
            trackEffects(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        /**
         * 1. 新、旧值相同直接return
         * 2. 对比的时候，比较的时原始值，而不是proxy
         * 3. 要先修改value的值，再去通知更新
         */
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(val) {
    return isRef(val) ? val.value : val;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        // 如果新值不是ref且旧值时ref，则替换调旧的value属性；
        // 否则整体替换
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        // 创建组件实例的时候，先从父组件获取provides
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    // 使用bind将component实例作为第一个参数传给emit，用于在emit中获取props对应的事件，所以用户只需要传入事件名及其他参数即可
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // setupStatefulComponent —— 初始化一个有状态的component；与其相对的是没有状态的函数式组件
    setupStatefulComponent(instance);
    // TODO 函数式组件的初始化
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // 执行setup时，对currentInstance进行赋值
        setCurrentInstance(instance);
        // 将props、emit作为参数传给setup
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        // 执行完setup后，清空currentInstance
        setCurrentInstance(null);
        // 处理setup的执行结果
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // setupResult is function or object
    // TODO function type
    // 如果setupResult是object类型，将setupResult放到组件实例上
    if (typeof setupResult === 'object') {
        // 将setupResult用proxyRefs进行处理，使得可以在render函数中通过key直接获取到ref类型（RefImpl）的值
        instance.setupState = proxyRefs(setupResult);
    }
    // 处理组件的render函数
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 使用函数包裹currentInstance的赋值：1. 方便调试 2. 代码可读性更高
function setCurrentInstance(instance) {
    currentInstance = instance;
}

// 因为用到了getCurrentInstance，所以provide和inject也必须在setup中使用
function provide(key, value) {
    // 存到instance上
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 组件只有在初次使用provide才修改原型
        if (provides === parentProvides) {
            // 将当前组件实例的provides的原型指向父组件实例的provides
            // 使用原型的原因：如果当前组件实例注入的依赖key值与父组件相同，使用原型继承不会修改父组件的注入，只会改变当前组件的provides
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 使用默认值
            return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                /**
                 * 先转化成vnode，然后所有的逻辑操作都基于 vnode 做处理
                 */
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, createText: hostCreateText, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // render方法是在createApp中调用的，此时为根组件，parentComponent是null，anchor也是null
        patch(null, vnode, container, null, null);
    }
    // n1是老的vnode，如果n1不存在，则说明是初始化
    // n2是新的vnode
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2;
        switch (type) {
            // Fragment 只渲染 children
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 VNode 类型
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = hostCreateText(children));
        hostInsert(textNode, container);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 元素初始化
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // 元素更新
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // el 是在mountElement时赋值给vnode.el 的，更新时是没有vnode.el的，所以需要把旧vnode的el赋值给新vnode
        const el = (n2.el = n1.el);
        // 更新props
        const oldProps = n1.props;
        const newProps = n2.props;
        patchProps(el, oldProps, newProps);
        // 更新children
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 1. 如果新的children是text，老的children是Array或text
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 如果老的children是array，则把老的 children 清空
            if (prevShapFlag & 8 /* ARRAY_CHILDREN */) {
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                // 当新旧text不相等时，直接将新的text插入节点中
                hostSetElementText(container, c2);
            }
        }
        else {
            // 2. 否则新的children是数组
            // 2.1 如果老的children是文本
            if (prevShapFlag & 4 /* TEXT_CHILDREN */) {
                // 清空文本
                hostSetElementText(container, '');
                // 渲染新的children
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 2.2 否则老的children 也是数组
                // diff
                patchKeydChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeydChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0; // 指向队首
        let e1 = c1.length - 1; // 指向c1的末尾
        let e2 = l2 - 1; // 指向c2的末尾
        function isSameVNodeType(n1, n2) {
            // vnode.type和vnode.key都相等时，则为同一vnode
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 1. 首首比较
        while (i <= e1 && i <= e2) {
            // 获取i指向的节点
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                // 递归patch
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                // 退出循环
                break;
            }
            i++;
        }
        // 2. 尾尾比较
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                // 递归patch
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                // 退出循环
                break;
            }
            e1--;
            e2--;
        }
        // 3. 经过上述比较，newChildren有多的节点，需要创建新节点
        // i > e1 && i <= e2：多的元素无论是在队首还是队尾，都能匹配到
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                // 锚点是真实元素
                // e2 + 1 > c2.length则放到队尾，否则插入到nextPos之前
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    // anchor是固定的，不需要放入循环
                    patch(null, c2[i], container, parentComponent, anchor);
                    // 每插入一个节点，i向后移动一位
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 4. 经过上述比较，oldChildren有多的节点，需要删除多余的老节点
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 5. 经过上述比较，newChildren、oldChildren都有多的节点，进行乱序比较
            // 建立 key-index映射表，相对于遍历children查找对应的vnode，时间复杂度从 O(n) 降到 O(1)
            // 5.1 中间对比（经过首首对比、尾尾对比，只剩下了中间不同的元素）
            let s1 = i;
            let s2 = i;
            const toBepatched = e2 - s2 + 1; // newChildren中总共需要被比较的节点数量
            let patched = 0; // 已经处理过的节点数量
            let moved = false; // 用于判断是否需要移动位置
            let maxNewIndexSoFar = 0;
            // 创建一个长度固定的数组，每个元素都初始化为0（会面会将值设为对应位置旧节点的 索引+1）
            const newIndexToOldIndexMap = new Array(toBepatched);
            for (let i = 0; i < toBepatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 创建newChildren的key-index的映射表
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                let newIndex;
                // 如果newChildren中的节点已经全部被对比过，将oldChildren中剩余的节点直接删除
                if (patched >= toBepatched) {
                    hostRemove(prevChild.el);
                    continue; // 跳过本次循环
                }
                // 可见key的重要性：vnode有key，则直接从映射中取；否则遍历查找newChildren
                if (prevChild.key !== null) {
                    // 如果能获取到prevChild.key对应的index，说明newChildren中有该节点
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果没有在newChildren找到对应的节点，则在oldChildren中删除该节点，否则递归更新节点
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 遍历旧队列时，index时从小到大；如果位置不变，对应的newIndex也应该时从小到大，如果后面的newIndex小于前面的，说明位置变了
                    if (newIndex > maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 设置映射表，index从0开始，而不是从newIndex开始；
                    // newIndexToOldIndexMap的含义：元素为0表示需要创建该元素；元素不为0，表示它在oldChildren上的位置。
                    // i是oldChildren中节点的index，该index可能是0，而newIndexToOldIndexMap初始化的时候就是0，表示没有对应的老节点、需要创建新节点，所以这里我们给i+1，区别于初始值。
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获得最长递增子序列，举例：[4,2,3] 获得最长递增子序列就是 [1,2]，意思就是index为1和2位置上的元素是最长自增子序列
            // 优化：使用 moved 参数判断是否有必要获取最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBepatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 如果newIndexToOldIndexMap的某一项为0，说明经过keyToNewIndexMap处理后，该位置依然没有对应的旧节点，需要创建节点
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 移动位置
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            // el 是真实节点
            const el = children[i].el;
            hostRemove(el);
        }
    }
    // 更新props
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    // 当修改prop时：1. nextProp是一个新值；2.nextProp是undefined/null
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (JSON.stringify(oldProps) !== '{}') {
                for (const key in oldProps) {
                    // 删除newProps中没有的旧属性
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // 将元素el存到vnode.el：访问this.$el时，即可从代理对象上访问instance.vnode.el
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        // 1. 处理children
        // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 children 类型
        if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // 如果包含子节点
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        else if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 如果是文本节点
            hostSetElementText(el, children);
        }
        // 2. 初始化时添加props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            // 处于元素初始化的流程中，没有旧vnode，设为null
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 组件初始化
        mountComponent(n2, container, parentComponent, anchor);
        // TODO updateComponent
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 1. 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
        setupComponent(instance);
        // 3. 执行render函数、递归patch，渲染组件
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        /**
         * 1. 使用effect包裹render逻辑，初次执行effect时会执行回调里的render函数，进行依赖收集；
         * 2. 当响应式对象的值发生变化时，会触发 _effect.run()，重新执行render函数。
         */
        effect(() => {
            const { proxy } = instance;
            // 如果是初始化
            if (!instance.isMounted) {
                console.log('init');
                // 执行render函数，生成vnode树
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 子节点树的 parentComponent 就是当前instance，作为第四个参数传入
                patch(null, subTree, container, instance, anchor);
                // 设置父组件的 vnode.el，使得proxy代理对象在处理this.$el时有值，不会报错undefined
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const preSubTree = instance.subTree;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(preSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
// 获得最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 创建元素节点
function createElement(type) {
    return document.createElement(type);
}
// 设置props
function patchProp(el, key, preVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 处理事件
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // 处理普通属性
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
// 将节点插入container容器中
function insert(child, parent, anchor) {
    // container.append(el);
    parent.insertBefore(child, anchor || null);
}
// 创建文本节点
function createText(text) {
    return document.createTextNode(text);
}
// 删除节点
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
// 设置节点的text
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    createText,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
