const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const {isMatch} = require('date-fns')
const {isValid} = require('date-fns')

const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(-1)
  }
}
initializeDBAndServer()

module.exports = app

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasCategoryAndProrityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const convertObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

// API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''

  const {status, priority, search_q = '', category} = request.query

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
        SELECT *
        FROM todo
        WHERE status = '${status}';`
        data = await db.all(getTodoQuery)
        response.send(
          data.map(dbObject => convertObjectToResponseObject(dbObject)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
        SELECT * 
        FROM todo
        WHERE priority = '${priority}';`
        data = await db.all(getTodoQuery)
        response.send(
          data.map(dbObject => convertObjectToResponseObject(dbObject)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasPriorityAndStatusProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
          SELECT * 
          FROM todo
          WHERE status = '${status}'  AND priority = '${priority}';`
          data = await db.all(getTodoQuery)
          response.send(
            data.map(dbObject => convertObjectToResponseObject(dbObject)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasSearchProperty(request.query):
      getTodoQuery = `
      SELECT * 
      FROM todo
      WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodoQuery)
      response.send(
        data.map(dbObject => convertObjectToResponseObject(dbObject)),
      )

      break

    case hasCategoryAndStatusProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
          SELECT *
          FROM todo
          WHERE status = '${status} AND category = '${category}';`
          data = await db.all(getTodoQuery)
          response.send(
            data.map(dbObject => convertObjectToResponseObject(dbObject)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `
        SELECT *
        FROM todo
        WHERE category = '${category}';`

        data = await db.all(getTodoQuery)

        response.send(
          data.map(dbObject => convertObjectToResponseObject(dbObject)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndProrityProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
          SELECT *
          FROM *
          WHERE category = '${category}' AND priority = '${priority}';`
          data = await db.all(getTodoQuery)
          response.send(
            data.map(dbObject => convertObjectToResponseObject(dbObject)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
  }
})

//  API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId};`

  const todo = await db.get(getTodoQuery)

  response.send(convertObjectToResponseObject(todo))
})

//  API 3

app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')

    const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE due_date = '${newDate}';`

    const result = await db.all(getTodoQuery)
    response.send(
      result.map(dbObject => convertObjectToResponseObject(dbObject)),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//  API 4

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isValid(new Date(dueDate))) {
          const postnewDate = format(new Date(dueDate), 'yyyy-MM-dd')

          const addTodoQuery = `
          INSERT INTO
            todo (id, todo, priority, status, category, due_date)
          VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${postnewDate}'
            );`

          await db.run(addTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//  API 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId}`

  const previousTodo = await db.get(getTodoQuery)
  let updateTodoQuery

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
        UPDATE todo
        SET 
          status = '${status}',
          priority = '${priority}',
          todo = '${todo}',
          category = '${category}',
          due_date = '${dueDate}'
        WHERE 
          id = ${todoId}`

        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
        UPDATE todo
        SET 
          status = '${status}',
          priority = '${priority}',
          todo = '${todo}',
          category = '${category}',
          due_date = '${dueDate}'
        WHERE 
          id = ${todoId}`

        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE todo
      SET 
        status = '${status}',
        priority = '${priority}',
        todo = '${todo}',
        category = '${category}',
        due_date = '${dueDate}'
      WHERE 
        id = ${todoId}`

      await db.run(updateTodoQuery)
      response.send('Todo Updated')

      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo
      SET 
        status = '${status}',
        priority = '${priority}',
        todo = '${todo}',
        category = '${category}',
        due_date = '${dueDate}'
      WHERE 
        id = ${todoId}`

        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
        UPDATE todo
        SET 
          status = '${status}',
          priority = '${priority}',
          todo = '${todo}',
          category = '${category}',
          due_date = '${newDate}'
        WHERE 
          id = ${todoId}`

        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }

      break
  }
})

//  API 6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
  DELETE FROM
    todo
  WHERE 
    id = ${todoId};`

  await db.run(getTodoQuery)

  response.send('Todo Deleted')
})
