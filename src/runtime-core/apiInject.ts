import { getCurrentInstance } from './component';

// 因为用到了getCurrentInstance，所以provide和inject也必须在setup中使用
export function provide(key, value) {
  // 存到instance上
  const currentInstance: any = getCurrentInstance();
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

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      // 使用默认值
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  }
}
