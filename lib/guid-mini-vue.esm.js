const isObject = val => {
    return val !== null && typeof val === 'object';
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO:
    // initProps()
    // initSlots()
    // setupStatefulComponent —— 初始化一个有状态的component；与其相对的是没有状态的函数式组件
    setupStatefulComponent(instance);
    // TODO 函数式组件的初始化
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        // setup可以返回一个function或者object，返回function则表示返回的是render函数，返回对象则会把该对象中的数据注入到当前组件的上下文中
        const setupResult = setup();
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // 元素初始化
    mountElement(vnode, container);
    // TODO 元素更新
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { children, props } = vnode;
    if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    else if (typeof children === 'string') {
        el.textContent = children;
    }
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
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
function mountComponent(vnode, container) {
    // 1. 创建组件实例
    const instance = createComponentInstance(vnode);
    // 2. 初始化组件属性：initProps、initSlots，调用setup、处理setup的返回值（当前仅处理返回类型为object）赋值到instance.setupState，将组件的render函数赋值到instance.render上
    setupComponent(instance);
    // 3. 执行render函数、递归patch，渲染组件
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // 执行render函数，生成vnode树
    console.log(instance);
    const subTree = instance.render();
    // 递归调用子VNode
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
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

export { createApp, h };
