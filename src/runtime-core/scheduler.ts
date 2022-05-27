const queue: any[] = []; // 任务队列
let isFlushPending = false; // 是否将清空任务队列的操作放入微任务（只需将清空任务队列的操作放入微任务一次，后续改变任务队列的数据即可）

/**
 * nextTick的用法：
 * 1. 传入回调函数 nextTick(fn)
 * 2. awit nextTick()
 */
const p = Promise.resolve();
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  // 创建微任务来清空队列
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  // 执行微任务的时候，设置isFlushPending为false
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
