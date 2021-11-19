const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

// tällä haetaan kaikki blogit
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
  .find({}).populate('user', { username: 1, name: 1 })

  response.json(blogs.map(blog => blog.toJSON()))
})

/*
const getTokenFrom = request => {  
  const authorization = request.get('authorization')  
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {    
    return authorization.substring(7)  
  }  
  return null
}
*/

// tämä lisää yhden blogin
blogsRouter.post('/', middeware.userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user
  const decodedToken = jwt.verify(token, process.env.SECRET)  
  if (!token || !decodedToken.id) {    
    return response.status(401).json({ error: 'token missing or invalid' })  
  }  

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes | 0,
    user: user.id
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog.id)
  await user.save()

  const populatedBlog = await savedBlog
  .populate('user', { username: 1, name: 1 })
  .execPopulate();

  response.json(savedblog.toJSON())
})

// tämä hakee yhden blogin
blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

// delete
blogRouter.delete('/:id', middeware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  const user = request.user
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    return response.status(401).json({
      error: 'you do not have permission to delete this blog',
    });
  }
})

// päivitys
blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes | 0,
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
    runValidators: true,
    context: 'query',
  })

  if (updatedBlog) {
    response.json(updatedBlog);
  } else {
    return response.status(404).end();
  }
/*
  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then(updatedblog => {
      response.json(updatedblog.toJSON())
    })
    .catch(error => next(error))
    */
})


module.exports = blogsRouter