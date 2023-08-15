export default class Queue {
  constructor() {
    this.queues = [];
    this.observerable = Queue.emptyfn;
  }

  /**
   * 进入队列
   * @param  {...any} list 必须 需要入队的元素
   */
  enqueue() {
    if (!arguments.length) {
      return;
    }
    this.observerable();
    for (const item of arguments) {
      this.queues.push(item);
    }
  }

  /**
   * 出队
   */
  dequeue() {
    let result = this.queues.shift();
    return typeof result !== "undefined" ? result : false;
  }

  /**
   * 返回队列最前面的元素
   */
  front() {
    let result = this.queues[0];
    return result;
  }

  /**
   * 队列是否为空
   */
  isEmpty() {
    return this.queues.length === 0;
  }

  /**
   * 返回队列长度
   */
  size() {
    return this.queues.length;
  }

  /**
   * 清空队列
   */
  clear() {
    this.queues.splice(0);
  }

  subscribe(fn) {
    this.observerable = fn;
  }

  static emptyfn() {}
}
