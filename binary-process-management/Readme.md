- Start Date: 2019-07-04
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

This spec outlines the state of process management for spawned binary (the query engine) with Photon along with the challenges, potential optimizations, and future.

It also covers considerations while deploying a service built with Photon to various cloud providers like Lambda, Zeit's now, etc.

In the remainder of this spec "binary" refers to the query engine binary used by Photon to execute queries against a data source.

# Basic Example

If the proposal involves a new or changed API, include a basic code example.
Omit this section if it's not applicable.

The photon API allows us to obtain a typesafe client via its constructor.

```js
const photon = new Photon()
```

At this point, no connection is established to the DB and the binary is not started yet. `Photon` provides two options to spawn the binary, either call connect method on Prisma

```js
await prisma.connect()
```

or perform a read/write that lazily connects.

```js
await prisma.users()
```

The `connect` operation starts the binary by finding a free port, and the binary acquires a DB connection.

Currently, starting the binary (building schema, establishing a DB connection, etc) can take up to `500ms` which makes "lazy connect" a less viable option for some applications. This will be touched on again in the "Unresolved Questions" section.

After the connection is established, the second request would utilize the started binary and the established connection, this is where, ideally, most of the requests should be as it is the critical path and overheads like starting the binary/acquiring a DB connection should be removed from this path.

Upcoming sections of this spec discuss the implications of various platforms (like Lambda) on this `connect` operation.

# Motivation

Photon relies on the spawned binary to execute reads/writes. This spec aims to document/understand/improve the following:

1. Operational implications of spawning a binary in various environments like serverless Lambda.
2. Dealing with issues like cold starts or frozen containers still holding a connection to DB.
3. Best practices for spawning sub-processes from a client (like Photon).
4. Thinking about failures scenarios like failing to find a free port.
5. Choosing the correct binary for execution, handling unavailability of an optimal binary gracefully.
6. Handling errors like "too many connections" from the binary.

This list of motivations is not complete and unordered.

# Detailed Design

## Connect

`connect` is where Photon spawns a binary and the following sequence of events happen

#### Find Free Port

Photon finds a free port by binding to port 0 with a light-weight TCP server (using node net -> createServer), this makes the OS allocate a random (albeit, pseudo serial) port to this server, then this server is closed and `Photon` saves the port in memory.

#### Binary Spawn

Photon then spawns the binary as a child process and provide it the environment variables including the detected port

This port is then provided to the binary as an environment variable and the binary starts an HTTP server on this port.

Getting a port like this is fairly reliable in a system with one process (like the light-weight TCP server in this case), but handing that over to binary for it to start an HTTP server can be slightly less reliable in an environment where a lot of ports (in parallel) are needed like running many services built with Photon in a test suite.

#### Waiting for the Binary to be Ready

In this workflow, Photon polls the binary's HTTP server for its stats at an interval. This can be optimized further by reducing the interval or relying on a simple TCP protocol.

To reach a ready state binary does the following (not exhaustive):

- Prepare/build schema
- Start HTTP server
- Acquire DB connection

Error handling around this is tricky as binary may crash for several reasons listed below.

#### Error Handling

Photon throws if the engine ready polling does not yield success after N attempts. There may be several reasons why preparing a process with the required context might fail, including but not limited to:

| Potential Error                            | Handling Strategy |
| ------------------------------------------ | ----------------- |
| Unable to bind to a free port              | Throw error       |
| Binary is not compatible with the platform | Throw error       |
| Binary fails to acquire a DB connection    | Throw error       |

We can consider changing how these scenarios are handled.

## Platforms and Cloud Providers

Photon will be used to build services on many platforms (operating systems), in this section, we explore some cloud provider with diverse characteristics

#### Lambda

**DB Connection Handling**

Nuances around handling DB connections in Lambda are not new and most of those nuances also apply to Photon.

Lambda has the concept of [reusing a container](https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/) which means that for subsequent invocations of the same function it may use an already existing container that has the allocated processes, memory, file system (`/tmp` is writable in Lambda), and even DB connection still available.

Any piece of code [outside the handler](https://docs.aws.amazon.com/lambda/latest/dg/programming-model-v2.html) remains initialized. This is a great place for `Photon` to call "connect" or at least call `Photon` constructor so that subsequent invocations can share a connection. There are some implications though they are not directly related to Photon but any system that would require a DB connection from Lambda:

| Implication                                                                                                                                                                                                                                                                                                                           | Potential Solution                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| It is not guaranteed that subsequent nearby invocations of a function will hit the same container. AWS can choose to create a new container at any time.                                                                                                                                                                              | Code should assume the container to be stateless and create a connection only if it does not exist. Photon already implements that logic.                        |
| The containers that are marked to be removed and are not being reused still keep a connection open and can stay in that state for some time (unknown and not documented from AWS), this can lead to a sub-optimal utilization of the DB connections                                                                                   | One potential solution is to use a lower idle connection timeout. Another solution can be to clean up the idle connections in a separate service<sup>1, 2</sup>. |
| Concurrent requests might spin up separate containers i.e. new connections. This makes connection pooling a bit difficult to manage because if there is a pool of size N and C concurrent containers, the effective number of connections is N \* C. It is very easy to exhaust `max_connection` limits of the underlying data source | Photon does not implement connection pooling right now. This can also be handled by limiting the concurrency levels of a Lambda function.                        |

<pre>
1. Note that these are recommendations and not best practices. These would vary from system to system.
2. [`serverless-mysql`](https://github.com/jeremydaly/serverless-mysql) is a library that implements this idea.
</pre>

**Cold Starts**

A lambda function container may be recycled at any point. There is no official documented amount of time on when that happen but running a function warmer does not work, containers are recycled regardless.

This means that some sporadic requests to `Photon` might involve spawning the binary and acquiring a DB connection in the critical path.

We can consider optimizing the binary to start faster by precomputing as much information as we can and other strategies discussed in "Unresolved Questions" section.

#### Now

Conceptually, `now` is similar to AWS lambda. The same practices/observations apply.

#### Compute (EC2, DO, etc)

This section outlines compute instances from all major cloud providers as well as local development environment. A traditional server may invoke connect when it is being bootstrapped making the critical path of requests light-weight (not involving spawning the binary or connecting to the DB) by reusing the spawned binary.

# Drawbacks

The following can be considered as drawbacks/hurdles which we might have to address with this approach of client building

| Drawback                                                            | Solution                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Easy of access to the correct target binary                         | Automatic download of the correct binary or teach users to compile it                                                            |
| Graceful error handling and reporting around binary spawning errors | Errors that inform users how they can move forward and telemetry to improve the binary resolution system                         |
| Lack of connection pooling                                          | Rely on DB proxies or HTTP APIs for data sources. Additionally, there can be a thin server layer to manage that on top of Photon |

# Alternatives

In this spec, we observed that connection handling in serverless environments has various rough edges that apply to any system that needs to acquire a DB connection from Lambda (doesn't apply only to Photon).

An alternative here (in future) can be to use HTTP API if the underlying data source supports it<sup>3</sup>.

<pre>3. AWS Aurora has a [Data API](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) in preview. Data sources like [FaunaDB expose APIs (like GraphQL)](https://docs.fauna.com/fauna/current/reference/graphql/) that are accessible over HTTP.</pre>

# How we teach this

Photon and spawning binary to execute reads/writes is a really powerful concept, however, it does bring the nuances of connection management back to Prisma users. Additional content in the form of docs, tutorials can be created to create more awareness around the community about these topics.

# Unresolved questions

- Optimize for cold starts?

Starting a binary and acquiring a DB connection might come in the path of many requests in serverless environments. This means that starting a binary should be as light-weight as possible by precomputing anything that lies in the startup path of the binary.

The binary size is another parameter that adds to cold starts as it increases the size of the bundle and that has an impact on cold start time.

- How does this workflow differ from the migration engine binary?

Migration engine binary is a subset of this workflow, same issues/rules apply regarding detection and spawning but the migration engine binary is not long living and uses an RPC protocol.
