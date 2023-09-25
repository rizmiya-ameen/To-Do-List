import { Component } from 'react'
import Todo from './Todo'
import AddTodo from './AddTodo'

const myList = [
  {
    todo: 'Buy more cat food',
    completed: true,
    urgent: true
  },{
    todo: 'Clean the bathroom',
    completed: false,
    urgent: true
  },{
    todo: 'Finish homework',
    completed: true,
    urgent: false
  }
]

class TodoList extends Component {

  state = {
    list: myList,
    prevList: []
  }

  saveList = (addTask) => {
    console.log(addTask)
    
    this.setState({list: [...this.state.list, addTask]})
  }

  saveList2 = (addTask) => {
    this.setState({list: [addTask, ...this.state.list]})
  }

  showUrgent = () => {
    const urgentList = this.state.list.filter(item => 
      item.urgent)
    this.setState({prevList: this.state.list, list: urgentList})
  }

  showAll = () => {
    this.setState({list: this.state.prevList})
  }

  removeTodo = (indexComplete) => {
    const toKeep = this.state.list.filter((item, index) => index !== indexComplete)
    this.setState({list: toKeep})
  }

  removeCompleted = () => {
    const toKeep = this.state.list.filter((item,index) => 
    !item.completed)
    this.setState({list: toKeep})
  }

  
  handleMarkComplete = (indexComplete) => {

    this.setState((prevState) => ({
      list: prevState.list.map((item, index) => {
        if (index === indexComplete) {
          return { ...item, completed: true }
        }
        return item;
      })
    }))

  }


  resetList = () => {
    this.setState({list: []})
  }


  render () {

    return (

      <div>

        <AddTodo saveList={this.saveList} saveList2={this.saveList2} showUrgent={this.showUrgent} showAll={this.showAll}/>

        {console.log(this.state.list)}

        <div className='todoList'>

          {this.state.list.map((item, index) => {
            return (
              <Todo 
                key={index}
                todo={item.todo}
                urgent={item.urgent}
                completed={item.completed}
                removeTodo={() => this.removeTodo(index)}
                handleMarkComplete={() => this.handleMarkComplete(index)}
              />
            )
          })}

        </div>      

        <div className='lowerBar'>

          <button className='rButton' onClick={this.resetList}>Reset</button>
          <button className='rButton' onClick={this.removeCompleted}>Clear Completed</button>

        </div>

      </div>
    )
  }
}

export default TodoList

