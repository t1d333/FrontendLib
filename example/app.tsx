import { Component } from "../src/component";
import { renderElement } from "../src/render";
import { VAttributes, createElement } from "../src/vdom";
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [_: string]: VAttributes & { key?: string | number };
    }
  }
}

type FormProps = { putTodo: (value: string) => void };
type FormState = { value: string };

class Form extends Component<FormProps, FormState> {
  render() {
    return (
      <form
        key="inputform"
        onsubmit={(e: SubmitEvent) => {
          e.preventDefault();
          this.props.putTodo(this.state.value);
        }}
      >
        <input
          key="test"
          type="text"
          placeholder="enter todo"
          class="input"
          onchange={(e: Event) => {
            this.setState((s) => {
              return { ...s, value: (e.target as HTMLInputElement).value };
            });
          }}
        />
      </form>
    );
  }
}

type AppState = {
  todos: { key: number; text: string; done: boolean }[];
  todosCount: number;
  completedCount: number;
};
type AppProps = {};

class App extends Component<AppProps, AppState> {
  protected state: AppState;
  constructor() {
    super();
    this.state = { todos: [], todosCount: 0, completedCount: 0 };
  }

  public componentDidUpdate(): void {}

  putTodo = (value: string) => {
    if (value != "") {
      this.setState((s: AppState) => {
        return {
          ...s,
          todosCount: s.todosCount + 1,
          todos: [...s.todos, { key: Date.now(), text: value, done: false }],
        };
      });
    } else {
      alert("Введите текст");
    }
  };

  toggleTodo = (id: number) => {
    const newTodos = this.state.todos.map((todo) => {
      return todo.key != id ? todo : { ...todo, done: !todo.done };
    });
    this.setState((s: AppState) => {
      return {
        ...s,

        completedCount: newTodos.reduce((sum, curr) => {
          return curr.done ? sum + 1 : sum;
        }, 0),

        todos: newTodos,
      };
    });
  };

  removeTodo = (id: number) => {
    const newTodos = this.state.todos.filter((todo) => {
      if (todo.key != id) return todo;
    });
    this.setState((s: AppState) => {
      return {
        ...s,
        todosCount: s.todosCount - 1,
        todos: newTodos,
      };
    });
  };

  render() {
    return (
      <div key="wrapper" className="wrapper">
        <div key="container" className="container">
          <h1 key="title" className="title">
            TodoList
          </h1>
          <Form key="form" putTodo={this.putTodo} />
          <ul key="todolist" className="todos">
            {...this.state.todos.map((todo) => (
              <li
                className={todo.done ? "todo" : "todo"}
                key={todo.key}
                onclick={() => {
                  this.toggleTodo(todo.key);
                }}
              >
                <span className={todo.done ? "done" : ""} key="text">
                  {todo.text}
                </span>
                <span
                  key="delete_btn"
                  className="material-symbols-outlined delete_btn"
                  onclick={() => {
                    this.removeTodo(todo.key);
                  }}
                >
                  delete
                </span>
              </li>
            ))}
          </ul>
          <div className="footer">
            <span>{`Totat : ${this.state.todosCount}`}</span>
            <span>{`Completed: ${this.state.completedCount}`}</span>
          </div>
        </div>
      </div>
    );
  }
}

const root = document.getElementById("root");

const app = <App />;
root?.appendChild(renderElement(app));
