Task2
Создайте Express сервер для управления блогом с использованием Sequelize ORM. Создайте модели User, Post, Comment с ассоциациями.

Создайте проект expressSequelizeBlog и установите зависимости
Создайте модели:
User:
id, username (unique), email (unique), password (hash не нужно, просто строка)

Post:
id, title, content, userId (foreign key), published (boolean), views (integer, default 0)

Comment:
id, content, userId (foreign key), postId (foreign key)

Настройте ассоциации:
User hasMany Post
Post belongsTo User
User hasMany Comment
Post hasMany Comment
Comment belongsTo User
Comment belongsTo Post

Создайте Express сервер со следующими маршрутами:

POST /users – создание пользователя

GET /users/:id/posts – получить все посты пользователя с комментариями

POST /posts – создание поста (требует userId)

GET /posts – список постов

Включать данные автора (user)
GET /posts/:id – получить пост с автором и комментариями *(включая авторов комментариев)

*При просмотре увеличивать счетчик views
PUT /posts/:id – обновление поста
DELETE /posts/:id – удаление поста
POST /posts/:postId/comments – *добавление комментария к посту

GET /stats – статистика:
Общее количество постов
Количество опубликованных постов
Общее количество комментариев
*Топ-5 постов по просмотрам