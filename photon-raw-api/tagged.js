const user = {
  email: {
    toString() {
      return `"public"."user"."email"`
    },
    isRaw() {
      return true
    },
  },
  firstName: {
    toString() {
      return `"public"."user"."first_name"`
    },
    isRaw() {
      return true
    },
  },
  toString() {
    return `"public"."user"`
  },
  isRaw() {
    return true
  },
}

async function pg(strings, ...params) {
  const results = []
  let vars = []
  for (let i = 0; i < params.length; i++) {
    results.push(strings[i])
    if (params[i].isRaw) {
      results.push(params[i].toString())
    } else {
      vars.push(params[i])
      results.push(`$${vars.length}`)
    }
  }
  return [results.join(''), vars]
}

const email = 'alice@prisma.io'
const firstName = 'Alice'

// TODO: turn this into an actual query
const out = pg`select ${user.firstName}, ${user.email} from ${user} where ${user.email} = ${email} and ${user.firstName} = ${firstName}`
out.then(console.log)
