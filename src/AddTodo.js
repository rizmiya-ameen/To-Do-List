import { Component} from 'react'

class AddTodo extends Component {

  state = {
    newTodo: '',
    urgent: false,
    completed: false,
    toggle: true
  }

  addTodo = event => {
    this.setState({newTodo: event.target.value}) 
  }

  
  addIsItUrgent = event => {
    this.setState({urgent: event.target.checked})
    console.log(this.state.urgent)
  }

  addNewTask = () => {
    const addTask = {
      todo: this.state.newTodo,
      urgent: this.state.urgent,
      completed: this.state.completed
    }
    console.log(addTask)

    if (this.state.newTodo.trim() !== '') {
      this.state.urgent ? this.props.saveList2(addTask) : this.props.saveList(addTask)
    }
    this.setState({newTodo: '', urgent: false, completed: false})
  }

  displayAll = () => {
    this.props.showAll()
    this.setState({toggle: true})
  }

  displayUrgent = () => {
    this.props.showUrgent()
    this.setState({toggle: false})
  }

  render () {
    return (

      <div>
          
        <h1 className='heading'>To-do List</h1>

        {this.state.toggle && 
          <div className='upBar'>
          
            <input className='taskBar' type='text' value={this.state.newTodo} onChange={this.addTodo} placeholder='Add your new TO-DO!'/>
            
            <div className='urgentCheckBox'>
              <input type="checkbox" checked={this.state.urgent} onChange={this.addIsItUrgent}/>
              <span className="tooltip">URGENT!</span>
            </div>

            <button className='addButton' onClick={this.addNewTask}>+</button>
            
          </div>}

          <div className='downBar'>
            {this.state.toggle ? (
              <button className='showButton' onClick={this.displayUrgent}>Show Urgent</button>
              ) : (
              <button className='showButton' onClick={this.displayAll}>Show All</button>
              )
            } 
          </div>
         
          {this.state.toggle ? <h3 className='subTopic'>All To-do's</h3> : <h3 className='subTopic'>Urgent To-do's</h3>
        }
               
      </div>
    )
  }
}

export default AddTodo

