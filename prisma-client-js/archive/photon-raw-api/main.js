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
  mgo: {
    user: {
      class: 'class',
      rate: 'rate',
      hrs: 'hrs',
      toString() {
        return 'user'
      },
    },
  },
}

console.dir(
  [
    { $match: { $or: [{ [raw.mgo.user.class]: 'a' }, { $and: [{ [raw.mgo.user.class]: 'b' }, { [raw.mgo.user.hrs]: { $exists: 1 } }] }] } },
    {
      $project: {
        [raw.mgo.user.rate + 'Multiply']: { $multiply: ['$' + raw.mgo.user.rate, '$' + raw.mgo.user.hrs, 52] },
        [raw.mgo.user.rate]: 1,
        [raw.mgo.user.class]: 1,
        [raw.mgo.user.hrs]: 1,
      },
    },
    {
      $match: {
        $or: [
          { $and: [{ [raw.mgo.user.class]: 'a' }, { [raw.mgo.user.rate]: { $gt: 20000 } }] },
          { $and: [{ [raw.mgo.user.class]: 'b' }, { [raw.mgo.user.rate + 'Multiply']: { $gt: 20000 } }] },
        ],
      },
    },
    { $project: { [raw.mgo.user.class]: 1, [raw.mgo.user.rate]: 1, [raw.mgo.user.hrs]: 1 } },
  ],
  { depth: Infinity },
)
