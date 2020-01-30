- Start Date: 2019-07-04
- RFC PR:
- Prisma Issue:

# Summary

The raw APIs provide a fairly type-safe escape hatch for Photon users that need highly-optimized queries or queries we don't yet support.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [How raw gets generated](#how-raw-gets-generated)
- [MySQL & Postgres](#mysql--postgres)
  - [Raw Query](#raw-query)
  - [Photon JS](#photon-js)
  - [Photon Go](#photon-go)
    - [photon.RawTemplate](#photonrawtemplate)
    - [photon.Raw](#photonraw)
  - [Other Complex SQL statements](#other-complex-sql-statements)
- [MongoDB](#mongodb)
  - [Raw Query](#raw-query-1)
  - [Photon JS](#photon-js-1)
  - [Photon Go](#photon-go-1)
- [HTTP Datasources?](#http-datasources)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# How raw gets generated

The Photon JS generator generates a `raw` object that contains all the models, fields & types for all data sources. Given the following schema:

```groovy
datasource pg {
  provider = "postgresql"
  url = "postgresql://user@localhost:5432/db?schema=public"
}

generator {
  provider = "photonjs"
}

model User {
  email     String @map("email")
  firstName String @map("first_name")
  posts     Post[]
  @@map("users")
}

model Post {
  id     Int    @id
  title  String @map("title")
  author User   @map("user_id")
  @@map("posts")
}
```

Prisma will generate the following `raw` object:

```js
const raw = {
  pg: {
    user: {
      email: '"public"."users"."email"',
      firstName: '"public"."users"."first_name"',
      toString() {
        return '"public"."users"'
      },
    },
    toString() {
      return '"public"'
    },
  },
}
```

We'll also generate a raw API. This will be dependent on both the data source and the language we're generating for. You'll see a couple examples below of
different flavours.

For JS, the API will look like this:

```js
const photon = new Photon()
console.log(`select ${raw.pg.user.firstName} from ${raw.pg.user}`)
```

Resolving to:

```sql
select "public"."users"."first_name", "public"."users"."email" from "public"."users"
```

- `pg` is the name of the datasource as defined by prisma. For Postgres, the data source connect to a specific schema, in our case the `public` schema.
- We can have multiple datasources by using different names (e.g. `pg`, `mgo`, etc.)
- Other languages will generate raw differently depending on their syntax

# MySQL & Postgres

## Raw Query

```sql
SELECT *
FROM
  (SELECT userid,
          username,
          ts,
          message_id,
          TYPE,
          Timestampdiff(YEAR, cp.birthdate, Curdate()) AS age,
          IF(postcode = '' || postcode IS NULL, '?', LEFT(cp.postcode, 1)) AS postcode,

     (SELECT Count(*)
      FROM community_image
      WHERE community_profile_id = userid
        AND community_image.verified IS NOT NULL) AS images_count,

     (SELECT PATH
      FROM community_image
      WHERE community_profile_id = userid
        AND main = 1
        AND community_image.verified IS NOT NULL
        AND PRIVATE = 0) AS image,
          CASE TYPE
              WHEN 'gift' THEN '/default/images/mobile-present-sent.png'
              WHEN 'poke' THEN '/default/images/mobile-poked.png'
              WHEN 'visit' THEN '/default/images/mobile-visited.png'
              ELSE '/default/images/mobile-added-to-friends.png'
          END AS icon,
          CASE TYPE
              WHEN 'gift' THEN (REPLACE('%s hat dir ein Geschenk geschickt', '%s', username))
              WHEN 'poke' THEN (REPLACE('%s hat dich angestupst', '%s', username))
              WHEN 'visit' THEN (REPLACE('%s hat dich besucht', '%s', username))
              ELSE (REPLACE('%s hat dir eine Freundschaftsanfrage gesendet', '%s', username))
          END AS description,
          gift
   FROM
     (SELECT sender AS userid,
             sender_name AS username,
             `timestamp` AS ts ,
             community_message_id AS message_id,
             TYPE,
             IF(TYPE = 'gift',
                  (SELECT Concat('{ \"gift_id\": "', cgu.community_gift_user_id, '", \"image\": "' ,
                                   (SELECT image
                                    FROM community_gifts cg
                                    WHERE cgu.community_gift_id = cg.community_gift_id), '", \"name"\: "',
                                   (SELECT name
                                    FROM community_gifts cg
                                    WHERE cgu.community_gift_id = cg.community_gift_id), '", \"text"\: "', cgu.message, '"}')
                   FROM community_gift_user cgu
                   WHERE cgu.community_gift_user_id = text), NULL) AS gift
      FROM community_message AS cm
      WHERE TYPE IN('gift',
                    'visit',
                    'poke',
                    'friendship-request')
        AND cm.receiver = '1658024'
        AND cm.sender IN
          (SELECT auth_user_id
           FROM auth_user
           WHERE auth_user_id = cm.sender
             AND `status` = 'normal')
      UNION SELECT visiter AS userid,
                   username,
                   Max(Concat(cv.date, ' ', cv.time)) AS ts,
                   NULL AS message_id,
                   'visit' AS TYPE,
                   NULL AS gift
      FROM community_visit AS cv
      RIGHT JOIN auth_user ON visiter = auth_user_id
      AND `status` = 'normal'
      WHERE community_profile_id = '1658024' GROUP  BY visiter) AS un
   LEFT JOIN community_profile cp ON cp.community_profile_id = userid
   LEFT JOIN auth_user_role aur ON aur.auth_user_id = userid) AS ch GROUP  BY userid,
                                                                              message_id,
                                                                              TYPE
ORDER  BY ts DESC
LIMIT 0,
      20
```

## Photon JS

```js
import { raw } from '@generated/photon'
const {
  pg: {
    community_profile,
    community_image,
    community_message,
    community_gift_user,
    community_gifts,
    auth_user,
    community_visit,
    auth_user_role,
  },
} = raw

photon.raw(`
SELECT *
FROM
  (SELECT userid,
          username,
          ts,
          message_id,
          TYPE,
          Timestampdiff(YEAR, ${community_profile.birthdate}, Curdate()) AS age,
          IF(postcode = '' || postcode IS NULL, '?', LEFT(${community_profile.postcode}, 1)) AS postcode,

     (SELECT Count(*)
      ${community_image}
      WHERE ${community_image.community_profile_id} = ${community_message.sender}
        AND ${community_image.verified} IS NOT NULL) AS images_count,

     (SELECT PATH
      FROM ${community_image}
      WHERE ${community_image.community_profile_id} = ${community_message.sender}
        AND ${community_image.main} = 1
        AND ${community_image.verified} IS NOT NULL
        AND ${community_image.private} = 0) AS image,
          CASE ${community_image.type}
              WHEN 'gift' THEN '/default/images/mobile-present-sent.png'
              WHEN 'poke' THEN '/default/images/mobile-poked.png'
              WHEN 'visit' THEN '/default/images/mobile-visited.png'
              ELSE '/default/images/mobile-added-to-friends.png'
          END AS icon,
          CASE ${community_image.type}
              WHEN 'gift' THEN (REPLACE('%s hat dir ein Geschenk geschickt', '%s', ${community_message.sender_name}))
              WHEN 'poke' THEN (REPLACE('%s hat dich angestupst', '%s', ${community_message.sender_name}))
              WHEN 'visit' THEN (REPLACE('%s hat dich besucht', '%s', ${community_message.sender_name}))
              ELSE (REPLACE('%s hat dir eine Freundschaftsanfrage gesendet', '%s', ${community_message.sender_name}))
          END AS description,
          gift
   FROM
     (SELECT ${community_message.sender} AS userid,
             ${community_message.sender_name} AS username,
             ${community_message.timestamp} AS ts ,
             ${community_message.community_message_id} AS message_id,
             ${community_message.type},
             IF(${community_message.type} = 'gift',
                  (SELECT Concat('{ \"gift_id\": "', ${community_gift_user.community_gift_user_id}, '", \"image\": "' ,
                                   (SELECT ${community_gifts.image}
                                    FROM ${community_gifts} cg
                                    WHERE ${community_gift_user.community_gift_id} = ${community_gifts.community_gift_id}), '", \"name"\: "',
                                   (SELECT ${community_gifts.name}
                                    FROM ${community_gifts} cg
                                    WHERE ${community_gift_user.community_gift_id} = ${community_gifts.community_gift_id}), '", \"text"\: "', ${community_gift_user.message}, '"}')
                   FROM ${community_gift_user} cgu
                   WHERE ${community_gift_user.user_id} = text), NULL) AS gift
      FROM ${community_message} AS cm
      WHERE ${community_message.type} IN('gift',
                    'visit',
                    'poke',
                    'friendship-request')
        AND ${community_message.receiver} = '1658024'
        AND ${community_message.sender} IN
          (SELECT ${auth_user.auth_user_id}
           FROM ${auth_user}
           WHERE ${auth_user.auth_user_id} = ${community_message.sender}
             AND ${auth_user.status} = 'normal')
      UNION SELECT ${community_visit.visiter} AS userid,
                   ${community_visit.username},
                   Max(Concat(${community_visit.date}, ' ', ${community_visit.time})) AS ts,
                   NULL AS message_id,
                   ${community_visit.visit} AS TYPE,
                   NULL AS gift
      FROM ${community_visit} AS cv
      RIGHT JOIN ${auth_user} ON ${auth_user.visitor} = ${auth_user.auth_visitor_id}
      AND ${community_visit.status} = 'normal'
      WHERE ${community_visit.community_profile_id} = '1658024' GROUP BY ${auth_user.visitor}) AS un
   LEFT JOIN ${community_profile} cp ON ${community_profile.community_profile_id} = ${community_visit.visiter}
   LEFT JOIN ${auth_user_role} aur ON ${auth_user_role.auth_user_id} = ${community_visit.visiter}) AS ch GROUP  BY ${community_visit.visiter}, message_id, ${community_visit.visit}
ORDER BY ts DESC
LIMIT 0, 20
`)
```

## Photon Go

We can use Go's templating system for raw queries. This will likely be more clear than `fmt.Sprintf`, but the downside is that there will be no syntax
highlighting.

### photon.RawTemplate

```go
package main

// generated client
import photongo "github.com/me/app/photon-go"

func main() {
  photon, err := photongo.Dial("some-url")
  if err != nil {
    panic(err)
  }

  var result struct {
    UserID string `json:"class"`
    Username string `json:"username"`
    Ts int `json:"ts"`
    MessageID int `json:"message_id"`
    Type int `json:"TYPE"`
    Age int `json:"age"`
    Postcode int `json:"postcode"`
  }

  err := photon.Pg.RawTemplate(&result, `
    SELECT *
    FROM
      (SELECT userid,
              username,
              ts,
              message_id,
              TYPE,
              Timestampdiff(YEAR, {{.community_profile.birthdate}}, Curdate()) AS age,
              IF(postcode = '' || postcode IS NULL, '?', LEFT({{.community_profile.postcode}}, 1)) AS postcode,

        (SELECT Count(*)
          {{.community_image}}
          WHERE {{.community_image.community_profile_id}} = {{.community_message.sender}}
            AND {{.community_image.verified}} IS NOT NULL) AS images_count,

        (SELECT PATH
          FROM {{.community_image}}
          WHERE {{.community_image.community_profile_id}} = {{.community_message.sender}}
            AND {{.community_image.main}} = 1
            AND {{.community_image.verified}} IS NOT NULL
            AND {{.community_image.private}} = 0) AS image,
              CASE {{.community_image.type}}
                  WHEN 'gift' THEN '/default/images/mobile-present-sent.png'
                  WHEN 'poke' THEN '/default/images/mobile-poked.png'
                  WHEN 'visit' THEN '/default/images/mobile-visited.png'
                  ELSE '/default/images/mobile-added-to-friends.png'
              END AS icon,
              CASE {{.community_image.type}}
                  WHEN 'gift' THEN (REPLACE('%s hat dir ein Geschenk geschickt', '%s', {{.community_message.sender_name}}))
                  WHEN 'poke' THEN (REPLACE('%s hat dich angestupst', '%s', {{.community_message.sender_name}}))
                  WHEN 'visit' THEN (REPLACE('%s hat dich besucht', '%s', {{.community_message.sender_name}}))
                  ELSE (REPLACE('%s hat dir eine Freundschaftsanfrage gesendet', '%s', {{.community_message.sender_name}}))
              END AS description,
              gift
      FROM
        (SELECT {{.community_message.sender}} AS userid,
                {{.community_message.sender_name}} AS username,
                {{.community_message.timestamp}} AS ts ,
                {{.community_message.community_message_id}} AS message_id,
                {{.community_message.type}},
                IF({{.community_message.type}} = 'gift',
                      (SELECT Concat('{ \"gift_id\": "', {{.community_gift_user.community_gift_user_id}}, '", \"image\": "' ,
                                      (SELECT {{.community_gifts.image}}
                                        FROM {{.community_gifts}} cg
                                        WHERE {{.community_gift_user.community_gift_id}} = {{.community_gifts.community_gift_id}}), '", \"name"\: "',
                                      (SELECT {{.community_gifts.name}}
                                        FROM {{.community_gifts}} cg
                                        WHERE {{.community_gift_user.community_gift_id}} = {{.community_gifts.community_gift_id}}), '", \"text"\: "', {{
    raw.community_gift_user.message}}, '"}}')
                      FROM {{.community_gift_user}} cgu
                      WHERE {{.community_gift_user.user_id}} = text), NULL) AS gift
          FROM {{.community_message}} AS cm
          WHERE {{.community_message.type}} IN('gift',
                        'visit',
                        'poke',
                        'friendship-request')
            AND {{.community_message.receiver}} = '1658024'
            AND {{.community_message.sender}} IN
              (SELECT {{.auth_user.auth_user_id}}
              FROM {{.auth_user}}
              WHERE {{.auth_user.auth_user_id}} = {{.community_message.sender}}
                AND {{.auth_user.status}} = 'normal')
          UNION SELECT {{.community_visit.visiter}} AS userid,
                      {{.community_visit.username}},
                      Max(Concat({{.community_visit.date}}, ' ', {{.community_visit.time}})) AS ts,
                      NULL AS message_id,
                      {{.community_visit.visit}} AS TYPE,
                      NULL AS gift
          FROM {{.community_visit}} AS cv
          RIGHT JOIN {{.auth_user}} ON {{.auth_user.visitor}} = {{.auth_user.auth_visitor_id}}
          AND {{.community_visit.status}} = 'normal'
          WHERE {{.community_visit.community_profile_id}} = '1658024' GROUP BY {{.auth_user.visitor}}) AS un
      LEFT JOIN {{.community_profile}} cp ON {{.community_profile.community_profile_id}} = {{.community_visit.visiter}}
      LEFT JOIN {{.auth_user_role}} aur ON {{.auth_user_role.auth_user_id}} = {{.community_visit.visiter}}) AS ch GROUP  BY {{
      raw.community_visit.visiter
    }}, message_id, {{.community_visit.visit}}
    ORDER BY ts DESC
    LIMIT 0, 20
    `)
  if err != nil {
    panic(err)
  }
}
```

### photon.Raw

For simpler queries, it may make sense to have a sprintf-style `Raw` API:

```go
package main

import (
  photongo "github.com/me/app/photon-go"
  user "github.com/me/app/photon-go/user"
)

func main() {
  photon, err := photongo.Dial("some-url")
  if err != nil {
    panic(err)
  }

  var result struct {
    user.Email
    user.FirstName
  }

  err := photon.Raw(&result, "select $1, $2 from $3", photongo.Pg.Users.Email, photongo.Pg.Users.FirstName, photongo.Pg.Users)
  if err != nil {
    panic(err)
  }
}
```

## Other Complex SQL statements

- https://www.notion.so/prismaio/Jeff-Seibert-292c628370e244bfa293b4ea494364aa
- https://www.notion.so/prismaio/Crazy-SQL-queries-a8e298d44385475da168eb3262e8b53f
- https://github.com/schickling/optonaut-api-server/blob/v9/handlers/optograph.go#L808

# MongoDB

## Raw Query

Given the following shape of the data:

```
db.user.insert({ "_id" : "3434sfsf", "rate" : 60, "class" : "a" });
db.user.insert({ "_id" : "sdsdsd", "rate" : 60, "class" : "b", "hrs" : 8 });
db.user.insert({ "_id" : "123", "rate" : 30000, "class" : "a", "hrs" : 8 });
db.user.insert({ "_id" : "12567", "rate" : 12000, "class" : "b" });
```

And the following query:

```
db.user.aggregate([
    { $match:
      {$or : [ {"class" : "a"},
              {$and : [{"class":"b"},{"hrs": {"$exists" : 1}}]}
            ]
      }
    },
    { $project :
      { rateMultiply : { $multiply: ["$rate","$hrs",52]},
        [mgo.user.rate]:1, class:1, hrs : 1
      }
    },
    { $match :
      {$or : [
              { $and : [ {"class" : "a"} ,
                          {"rate" : {"$gt" : 20000}}
                        ]
              } ,
              { $and : [ {"class" : "b"},
                          {rateMultiply: {$gt:20000}}
                        ]
                }
              ]
      }
    },
    { $project: {class : 1 , rate : 1 , hrs : 1 }
    }
])
```

## Photon JS

We can rewrite for Photon JS as:

```js
import { raw } from '@generated/photon'
const {
  mgo: { user },
} = raw

await photon.raw([
  {
    $match: {
      $or: [
        { [user.class]: 'a' },
        { $and: [{ [user.class]: 'b' }, { [user.hrs]: { $exists: 1 } }] },
      ],
    },
  },
  {
    $project: {
      [user.rate + 'Multiply']: {
        $multiply: ['$' + user.rate, '$' + user.hrs, 52],
      },
      [user.rate]: 1,
      [user.class]: 1,
      [user.hrs]: 1,
    },
  },
  {
    $match: {
      $or: [
        { $and: [{ [user.class]: 'a' }, { [user.rate]: { $gt: 20000 } }] },
        {
          $and: [
            { [user.class]: 'b' },
            { [user.rate + 'Multiply']: { $gt: 20000 } },
          ],
        },
      ],
    },
  },
  { $project: { [user.class]: 1, [user.rate]: 1, [user.hrs]: 1 } },
])
```

## Photon Go

Not familiar enough with Mongo to write the above query in Go, but the idea would look something like this:

```go
package main

// generated client
import photongo "github.com/me/app/photon-go"

func main() {
  photon, err := photongo.Dial("some-url")
  if err != nil {
    panic(err)
  }

  var result struct {
    Class string `json:"class"`
    Rate int `json:rate`
    Hours int `json:hrs`
  }

  err := photon.Mgo.Raw(&result, bson.M{
    photongo.Mgo.Class: "a",
    photongo.Mgo.Rate: 1,
    photongo.Mgo.Hrs: 52
  })
  if err != nil {
    panic(err)
  }
}
```

- `bson.M` is a `map[string]interface{}`: https://godoc.org/labix.org/v2/mgo/bson#M

# HTTP Datasources?

For HTTP datasources, I don't think it makes too much sense to generate a raw API. We may want to add some sort of HTTP client in the future, but I think that
makes more sense done outside of the photon context.
