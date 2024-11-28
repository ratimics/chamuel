export default class TaskModule {
  constructor() {
    this.tasks = new Map();
  }

  addTask(taskId, task) {
    this.tasks.set(taskId, task);
  }

  removeTask(taskId) {
    this.tasks.delete(taskId);
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}
