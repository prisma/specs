# Postgres

## Datatypes

| Type |                     Name                      |              Description               | Storage Size |                                          Range                                           |
| :--: | :-------------------------------------------: | :------------------------------------: | :----------: | :--------------------------------------------------------------------------------------: |
| NUM  |                 bigint, int8                  |             signed integer             |   8 bytes    |                       -9223372036854775808 to +9223372036854775807                       |
| NUM  |              bigserial, serial8               |        autoincrementing integer        |   8 bytes    |                                 1 to 9223372036854775807                                 |
| NUM  |           double precision, float8            | double precision floating-point number |   8 bytes    |                               15 decimal digits precision                                |
| NUM  |              integer, int, int4               |             signed integer             |   4 bytes    |                                -2147483648 to +2147483647                                |
| NUM  |    numeric [ (p, s) ], decimal [ (p, s) ]     | exact numeric of selectable precision  |   variable   | up to 131072 digits before the decimal point; up to 16383 digits after the decimal point |
| NUM  |                 real, float4                  | single precision floating-point number |   4 bytes    |                                6 decimal digits precision                                |
| NUM  |                smallint, int2                 |             signed integer             |   2 bytes    |                                     -32768 to +32767                                     |
| NUM  |             smallserial, serial2              |        autoincrementing integer        |   2 bytes    |                                        1 to 32767                                        |
| NUM  |                serial, serial4                |        autoincrementing integer        |   4 bytes    |                                     1 to 2147483647                                      |
| MON  |                     money                     |            currency amount             |   8 bytes    |                      -92233720368547758.08 to +92233720368547758.07                      |
| CHAR |        character [ (n) ], char [ (n) ]        |     fixed-length character string      |     TODO     |                                           TODO                                           |
| CHAR |  character varying [ (n) ], varchar [ (n) ]   |    variable-length character string    |     TODO     |                                           TODO                                           |
| CHAR |                     text                      |    variable-length character string    |   variable   |                                           TODO                                           |
| BIN  |                     bytea                     |       binary data ("byte array")       |     TODO     |                                           TODO                                           |
|      |    timestamp [ (p) ][ without time zone ]     |      date and time (no time zone)      |   8 bytes    |                4713 BC - 294276 AD (1 microsecond / 14 digits resolution)                |
|      | timestamp [ (p) ] with time zone, timestamptz |   date and time, including time zone   |   8 bytes    |                4713 BC - 294276 AD (1 microsecond / 14 digits resolution)                |
|      |                     date                      |    calendar date (year, month, day)    |   4 bytes    |                         4713 BC - 5874897 AD (1 day resolution)                          |
|      |      time [ (p) ] with time zone, timetz      |    time of day, including time zone    |   12 bytes   |               00:00:00 - 24:00:00 (1 microsecond / 14 digits resolution )                |
|      |       time [ (p) ][ without time zone ]       |       time of day (no time zone)       |   16 bytes   |                                                                                          |

**Type Reference**

- NUM: [Numeric Types](https://www.postgresql.org/docs/9.5/datatype-numeric.html)
- MON: [Monetary Types](https://www.postgresql.org/docs/9.5/datatype-money.html)
- CHAR: [Character Types](https://www.postgresql.org/docs/9.5/datatype-character.html)
- BIN: [Binary Data Types](https://www.postgresql.org/docs/9.5/datatype-binary.html)

## TODO categorize

|                     Name                      |            Description             | Storage Size | Range |
| :-------------------------------------------: | :--------------------------------: | :----------: | :---: |
|                  bit [ (n) ]                  |      fixed-length bit string       |              |       |
|      bit varying [ (n) ], varbit [ (n) ]      |     variable-length bit string     |              |       |
|                 boolean, bool                 |    logical Boolean (true/false)    |              |       |
|                      box                      |     rectangular box on a plane     |              |       |
|                     cidr                      |    IPv4 or IPv6 network address    |              |       |
|                    circle                     |         circle on a plane          |              |       |
|                     date                      |  calendar date (year, month, day)  |              |       |
|                     inet                      |     IPv4 or IPv6 host address      |              |       |
|          interval [ fields ][ (p) ]           |             time span              |              |       |
|                     json                      |         textual JSON data          |              |       |
|                     jsonb                     |    binary JSON data, decomposed    |              |       |
|                     line                      |      infinite line on a plane      |              |       |
|                     lseg                      |      line segment on a plane       |              |       |
|                    macaddr                    | MAC (Media Access Control) address |              |       |
|                     path                      |     geometric path on a plane      |              |       |
|                    pg_lsn                     |   PostgreSQL Log Sequence Number   |              |       |
|                     point                     |     geometric point on a plane     |              |       |
|                    polygon                    |  closed geometric path on a plane  |              |       |
|                     text                      |  variable-length character string  |              |       |
|       time [ (p) ][ without time zone ]       |     time of day (no time zone)     |              |       |
|      time [ (p) ] with time zone, timetz      |  time of day, including time zone  |              |       |
|    timestamp [ (p) ][ without time zone ]     |    date and time (no time zone)    |              |       |
| timestamp [ (p) ] with time zone, timestamptz | date and time, including time zone |              |       |
|                    tsquery                    |         text search query          |              |       |
|                   tsvector                    |        text search document        |              |       |
|                 txid_snapshot                 | user-level transaction ID snapshot |              |       |
|                     uuid                      |   universally unique identifier    |              |       |
|                      xml                      |              XML data              |              |       |
