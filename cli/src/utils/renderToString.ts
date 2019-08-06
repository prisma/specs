import { render } from 'ink'
import EventEmitter from 'eventemitter3'
import { Terminal } from 'xterm'

export interface StreamOptions {
  columns?: number
  terminal?: Terminal
}

// Fake process.stdout
export class Stdout extends EventEmitter {
  output: string
  columns: number
  constructor({ columns }: StreamOptions) {
    super()
    this.output = ''
    this.columns = columns || 100
  }

  write(str: string) {
    const sanitized = str.replace(/\n/g, '\r\n')
    this.emit('data', sanitized)
    this.output = sanitized
  }

  toString() {
    return this.output.replace(/\n/g, '\r\n')
  }
}

export class Stdin extends EventEmitter<any> {
  readonly readableHighWaterMark: number = 1000
  readonly readableLength: number = 10000
  isRaw?: boolean = true
  isTTY: boolean = true
  _read(size: number) {}
  _destroy(err: Error | null, callback: (err?: null | Error) => void) {}
  setRawMode(mode: boolean) {}
  push(chunk: any, encoding?: string) {
    this.emit('data', chunk)
    return true
  }
  destroy(error?: Error) {}
  setEncoding(env: any) {}
  resume() {}
}

export default function renderToString(
  node: any,
  { columns, terminal }: StreamOptions = {},
  cb?: (result: string) => any
): string {
  const stdout = new Stdout({ columns })
  const stdin = new Stdin()

  render(node, {
    stdout,
    stdin,
    debug: true,
    transformers: [
      s => {
        console.log(s)
        return s
      },
    ],
  } as any)

  if (terminal) {
    terminal.on('key', key => {
      stdin.push(key)
    })
  }

  stdout.on('data', data => {
    cb && cb(data)
  })

  cb && cb(String(stdout))

  return String(stdout)
}
