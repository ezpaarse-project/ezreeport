type Namespace = any;
type Task = any;
type TaskPreset = any;
type Template = any;

export type MigrationData = {
  namespaces: Namespace[];
  taskPresets: TaskPreset[];
  tasks: Task[];
  templates: Template[];
};
