'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const isObject = val => {
    return val !== null && typeof val === 'object';
};
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

// 依赖收集；每个key对应一个独一无二的dep，在dep中收集activeEffect
const targetMap = new Map();
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
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
        instance.setupState = setupResult;
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

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { type, shapeFlag } = vnode;
    switch (type) {
        // Fragment 只渲染 children
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 VNode 类型
            if (shapeFlag & 1 /* ELEMENT */) {
                processElement(vnode, container);
            }
            else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                processComponent(vnode, container);
            }
            break;
    }
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processElement(vnode, container) {
    // 元素初始化
    mountElement(vnode, container);
    // TODO 元素更新
}
function mountElement(vnode, container) {
    // 将元素el存到vnode.el：访问this.$el时，即可从代理对象上访问instance.vnode.el
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, props, shapeFlag } = vnode;
    // 1. 处理children
    // 通过 VNode 的 shapeFlag property 与枚举变量 ShapeFlags 进行与运算是否大于0来判断 children 类型
    if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        // 如果包含子节点
        mountChildren(vnode, el);
    }
    else if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        // 如果是文本节点
        el.textContent = children;
    }
    // 2. 处理props
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // 处理事件
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            // 处理普通属性
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(v => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    // 组件初始化
    mountComponent(vnode, container);
    // TODO updateComponent
}
function mountComponent(initialVNode, container) {
    // 1. 创建组件实例
    const instance = createComponentInstance(initialVNode);
    // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
    setupComponent(instance);
    // 3. 执行render函数、递归patch，渲染组件
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // 执行render函数，生成vnode树
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // 递归调用子VNode
    patch(subTree, container);
    // 设置父组件的 vnode.el，使得proxy代理对象在处理this.$el时有值，不会报错undefined
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            /**
             * 先转化成vnode，然后所有的逻辑操作都基于 vnode 做处理
             */
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
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

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.renderSlots = renderSlots;
