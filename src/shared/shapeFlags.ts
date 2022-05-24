// 左移运算符用于二进制，所以shapeFlag是四位数的二进制
export const enum ShapeFlags {
  // 用于判断vnode的类型是否是element
  ELEMENT = 1, // 0001
  // 用于判断vnode的类型是否是有状态组件
  STATEFUL_COMPONENT = 1 << 1, // 0010
  // 用于判断 cildren 类型是否是 string（文本）
  TEXT_CHILDREN = 1 << 2, // 0100
  // 用于判断 children 类型是否是 Array
  ARRAY_CHILDREN = 1 << 3, // 1000
  // 用于判断 children 是否是插槽
  SLOTS_CHILDREN = 1 << 4, // 10000
}
