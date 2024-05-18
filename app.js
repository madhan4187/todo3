const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initilizeDbAndServer()

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.property !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getToDoQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getToDoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getToDoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getToDoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break

    default:
      getToDoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  const data = await db.all(getToDoQuery)
  response.send(data)
})

app.get('/todos/', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `
  SELECT *
  FROM todo`
  const todo = await db.all(getToDoQuery)
  response.send(todo)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId}`
  const todo = await db.get(getToDoQuery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const addTodoquery = `
  INSERT INTO todo (id,todo,priority,status)
  VALUES (${id},'${todo}','${priority}','${status}')`
  await db.run(addTodoquery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'status'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
  }

  const previousTodoQuery = `
  SELECT *
  FROM 
    todo
  Where  
    id = ${todoId}`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  console.log(request.body)
  const updateTodoQuery = `
  UPDATE 
    todo
  SET 
    todo='${todo}',
    priority = '${priority},
    status = '${status}'
  WHERE 
    id= '${todoId}`

  const data = await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (requset, response) => {
  const {todoId} = requset.params
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id=${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
