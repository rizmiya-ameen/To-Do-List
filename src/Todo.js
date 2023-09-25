function Todo ({todo, completed, removeTodo, handleMarkComplete}) {

  return (
    
    <div className='list'>

      <p className={ completed ? 'complete' : 'notcomplete'}>{todo}</p>
     
      {console.log(completed)}

      <div className='sideBar'>

        <button className='sideButton2' onClick={handleMarkComplete}>Done ✓</button>
      
        <button className='sideButton1' onClick={removeTodo}>🗑</button>

      </div>
      
      

    </div>
  )
}
 
export default Todo

