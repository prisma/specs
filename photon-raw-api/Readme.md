- Start Date: 2019-07-04
- RFC PR:
- Prisma Issue:

# Summary

The raw APIs provide a low-level, "best effort" type-safe, escape-hatch for Photon users that need to use complex queries.

<!-- toc -->

- [Raw's API is Datasource Dependent](#raws-api-is-datasource-dependent)
- [Datasources](#datasources)
  - [MySQL & Postgres](#mysql--postgres)
    - [Photon JS](#photon-js)
      - [Real-world SQL Query](#real-world-sql-query)
      - [Real-world JS equivalent](#real-world-js-equivalent)
    - [Photon Go](#photon-go)
      - [photon.RawTemplate](#photonrawtemplate)
      - [photon.Raw](#photonraw)
    - [Other Complex SQL statements](#other-complex-sql-statements)
  - [MongoDB](#mongodb)
    - [Raw Query](#raw-query)
    - [Photon JS](#photon-js-1)
    - [Photon Go](#photon-go-1)
  - [HTTP](#http)

<!-- tocstop -->

# Raw's API is Datasource Dependent

Photon's Raw API will stay true to the query language of the datasource. For this reason, the raw's API will change depending on the datasource we provide.

|   Data source   | Raw API |
| :-------------: | :-----: |
|    Postgres     | string  |
| MySQL / MariaDB | string  |
|      Mongo      |  json   |
|     SQLite      | string  |
|    DynamoDB     |  json   |
|  ElasticSearch  |  json   |
|    Cassandra    | string  |
|     FaunaDB     | string  |
|      Neo4j      | string  |

- For the JSON-based APIs it's likely that we can generate a **full type-safe** version of the API. This will take time to do though. We may still want to
  provide raw APIs in the meantime as they will allow us to incrementally add type-safe APIs while giving users an escape-hatch for complex queries we haven't
  provided yet.

**Open Question**: How much more work would it be just to do it upfront?

# Datasources

## MySQL & Postgres

Given the following schema:

```groovy
datasource pg {
  provider = "postgresql"
  url = "postgresql://user@localhost:5432/db?schema=public"
}

model User {
  email     String @map("email")
  firstName String @map("first_name")
  @@map("users")
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
const { user } = Photon.raw.pg
const alice = 'alice@prisma.io'

// using a tagged template
await photon.raw.pg`select ${user.firstName} from ${user} where ${user.email} = ${alice}`
```

Which resolves to the following query:

```sql
select "public"."users"."first_name", "public"."users"."email" from "public"."users" where "public"."users"."email" = $1
```

- Initial tagged template [implementation here](./tagged.js)
- We use prepared parameters to avoid SQL injection attacks
- `pg` is the name of the datasource as defined by prisma. For Postgres, the data source connect to a specific schema, in our case the `public` schema.
- We can have multiple datasources by using different names (e.g. `pg`, `mgo`, etc.)
- Other languages will generate raw differently depending on their syntax

### Photon JS

#### Real-world SQL Query

Given the following SQL query:

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

#### Real-world JS equivalent

The above SQL query results in:

```js
import Photon from '@generated/photon'

const photon = new Photon()
const {
  community_profile,
  community_image,
  community_message,
  community_gift_user,
  community_gifts,
  auth_user,
  community_visit,
  auth_user_role,
} = Photon.raw.pg // or `Photon.datasource.pg`

await photon.raw.pg`
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
                                    WHERE ${community_gift_user.community_gift_id} = ${community_gifts.community_gift_id}), '", \"text"\: "', ${
  community_gift_user.message
}, '"}')
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
   LEFT JOIN ${auth_user_role} aur ON ${auth_user_role.auth_user_id} = ${community_visit.visiter}) AS ch GROUP  BY ${community_visit.visiter}, message_id, ${
  community_visit.visit
}
ORDER BY ts DESC
LIMIT 0, 20
`
```

### Photon Go

We can use Go's templating system for raw queries. This will likely be more clear than `fmt.Sprintf`, but the downside is that there will be no syntax
highlighting.

#### photon.RawTemplate

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

#### photon.Raw

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

  err := photon.Raw(&result, "select %s, %s from %s where %s = $1", photongo.Pg.Users.Email, photongo.Pg.Users.FirstName, photongo.Pg.Users)
  if err != nil {
    panic(err)
  }
}
```

### Other Complex SQL statements

- https://www.notion.so/prismaio/Crazy-SQL-queries-a8e298d44385475da168eb3262e8b53f
- https://github.com/schickling/optonaut-api-server/blob/v9/handlers/optograph.go#L808

## MongoDB

> https://docs.mongodb.com/manual/crud/

### Raw Query

Given the following shape of the data:

```
db.user.insert({ "rate" : 60, "class" : "a" });
db.user.updateOne({ "_id" : "507f191e810c19729de860ea" }, { "rate" : 60, "class" : "b", "hrs" : 8, profile: { size: "l" } });
```

### Photon JS

We can rewrite the equivalent Photon JS as:

```js
import Photon from '@generated/photon'

const { user } = Photon.raw.mgo // or `Photon.datasource.mgo`
const photon = new Photon()
const mgo = photon.raw.mgo

await mgo.user.insert({
  [user.rate]: 60,
  [user.class]: 'a',
})

await mgo.user.updateOne(
  {
    [user.id]: '507f191e810c19729de860ea',
  },
  {
    [user.class]: 'b',
    [user.hrs]: 8,
    [user.profile]: {
      [user.profile.size]: 'l',
    },
  },
)
```

- During generation, it'd be good to pull all the possible method (`insert`, `updateOne`) from the main mongodb driver. We could also do it as a precommit hook.
  This will always keep us in-sync with new features.

- **Open Question:** can we just pass the whole query into mongo as a JSON object? right now it's weirdly half-outside `user.updateMany`, the rest inside.
- **TODO** Look into how the mongo-driver even knows about the user collection key in the first place.

### Photon Go

```go
package main

// generated client
import photongo "github.com/me/app/photon-go"

func main() {
  photon, err := photongo.New()
  if err != nil {
    panic(err)
  }

  var result struct {
    ID    bsontype.ObjectID `json:"_id"`
    Class string            `json:"class"`
    Rate  int               `json:rate`
    Hours int               `json:hrs`
  }

  // insert into Mongo
  err := photon.Raw.Mgo.User.Insert(&result, bson.M{
    photongo.Mgo.Rate: 60,
    photongo.Mgo.Class: "a",
  })
  if err != nil {
    return err
  }

  // update
  err := photon.Raw.Mgo.User.UpdateOne(
    &result,
    bson.M{
      photongo.Raw.Mgo.ID: "507f191e810c19729de860ea",
    },
    bson.M{
      photongo.Raw.Mgo.Class: "b",
      photon.Raw.Mgo.Hrs: 8,
      photon.Raw.Mgo.Profile: bson.M{
        photon.Raw.Mgo.Profile.Size: "l",
      },
    },
  )
  if err != nil {
    return err
  }
}
```

- `bson.M` is a `map[string]interface{}`: https://godoc.org/labix.org/v2/mgo/bson#M

## HTTP

For HTTP datasources, I don't think it makes too much sense to generate a raw API. We may want to add some sort of HTTP client in the future, but I think that
makes more sense done outside of the photon context.
