export const extend = Object.assign;

export const isObject = val => {
  return val !== null && typeof val === 'object';
};

export const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal);

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 转换为驼峰格式
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : '';
  });
};
// 将首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : '';
};

export * from './shapeFlags';
