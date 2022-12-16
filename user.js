const db = require('./database');
const MAXCONNECTION = 2;

const init = async () => {
  await db.run(
    'CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(32));'
  );
  await db.run(
    'CREATE TABLE Friends (id INTEGER PRIMARY KEY AUTOINCREMENT, userId int, friendId int);'
  );
  const users = [];
  const names = ['foo', 'bar', 'baz'];
  for (i = 0; i < 27000; ++i) {
    let n = i;
    let name = '';
    for (j = 0; j < 3; ++j) {
      name += names[n % 3];
      n = Math.floor(n / 3);
      name += n % 10;
      n = Math.floor(n / 10);
    }
    users.push(name);
  }
  const friends = users.map(() => []);
  for (i = 0; i < friends.length; ++i) {
    const n = 10 + Math.floor(90 * Math.random());
    const list = [...Array(n)].map(() =>
      Math.floor(friends.length * Math.random())
    );
    list.forEach((j) => {
      if (i === j) {
        return;
      }
      if (friends[i].indexOf(j) >= 0 || friends[j].indexOf(i) >= 0) {
        return;
      }
      friends[i].push(j);
      friends[j].push(i);
    });
  }
  console.log('Init Users Table...');
  await Promise.all(
    users.map((un) => db.run(`INSERT INTO Users (name) VALUES ('${un}');`))
  );
  console.log('Init Friends Table...');
  await Promise.all(
    friends.map((list, i) => {
      Promise.all(
        list.map((j) =>
          db.run(
            `INSERT INTO Friends (userId, friendId) VALUES (${i + 1}, ${
              j + 1
            });`
          )
        )
      );
    })
  );
  console.log('Ready.');
};
module.exports.init = init;

/**
 * Get users connection with current User and Max relation ship by BFS Algorithm
 * @param userId Current User
 * @param users  Users who simliars with search name
 * @param maxCon Max Connection that represent how deep max relation ship with current User
 * @returns A Promise for the completion of the callback.
 */
const GetConnection = async (userId, users, maxCon) => {
  let queue = [userId];
  let visited = [];
  let currentCon = 0;

  while (currentCon < maxCon) {
    visited.push(...queue);

    const results = await db
      .all(`SELECT friendId FROM Friends WHERE userId IN (${queue})`)
      .catch((err) => {
        return null;
      });

    queue = [];
    if (results != null && results.length > 0) {
      for (const result of results) {
        if (visited.findIndex((element) => element == result.friendId) < 0) {
          queue.push(result.friendId);
          visited.push(result.friendId);

          for (let user of users) {
            if (user.id == result.friendId && user.connection == undefined) {
              console.log('set1');
              user.connection = currentCon + 1;
            }
          }
        }
      }
    }
    currentCon++;
  }
  console.log(users);

  return users;
};

const search = async (req, res) => {
  const query = req.params.query;
  const userId = parseInt(req.params.userId);

  let results = await db
    .all(`SELECT id, name FROM Users where name LIKE '${query}%' LIMIT 20;`)
    .catch((err) => {
      res.statusCode = 500;
      res.json({ success: false, error: err });
      return;
    });

  if (results.length > 0) {
    await GetConnection(userId, results, MAXCONNECTION);
  }

  res.statusCode = 200;
  res.json({
    success: true,
    users: results,
  });
};
module.exports.search = search;

const friend = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const friendId = parseInt(req.params.friendId);

  db.run(
    `INSERT INTO Friends (userId, friendId) VALUES (${userId}, ${friendId});`
  )
    .then((results) => {
      res.statusCode = 200;
      res.json({
        success: true,
      });
    })
    .catch((err) => {
      res.statusCode = 500;
      res.json({ success: false, error: err });
    });
};
module.exports.friend = friend;

const unfriend = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const friendId = parseInt(req.params.friendId);

  db.run(
    `DELETE FROM Friends WHERE userId="${userId}" and friendId="${friendId}"`
  )
    .then((results) => {
      res.statusCode = 200;
      res.json({
        success: true,
      });
    })
    .catch((err) => {
      res.statusCode = 500;
      res.json({ success: false, error: err });
    });
};
module.exports.unfriend = unfriend;
