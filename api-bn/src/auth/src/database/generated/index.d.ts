
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model sentri_identifiers
 * 
 */
export type sentri_identifiers = $Result.DefaultSelection<Prisma.$sentri_identifiersPayload>
/**
 * Model sentri_sessions
 * 
 */
export type sentri_sessions = $Result.DefaultSelection<Prisma.$sentri_sessionsPayload>
/**
 * Model sentri_users
 * 
 */
export type sentri_users = $Result.DefaultSelection<Prisma.$sentri_usersPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Sentri_identifiers
 * const sentri_identifiers = await prisma.sentri_identifiers.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Sentri_identifiers
   * const sentri_identifiers = await prisma.sentri_identifiers.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.sentri_identifiers`: Exposes CRUD operations for the **sentri_identifiers** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sentri_identifiers
    * const sentri_identifiers = await prisma.sentri_identifiers.findMany()
    * ```
    */
  get sentri_identifiers(): Prisma.sentri_identifiersDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sentri_sessions`: Exposes CRUD operations for the **sentri_sessions** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sentri_sessions
    * const sentri_sessions = await prisma.sentri_sessions.findMany()
    * ```
    */
  get sentri_sessions(): Prisma.sentri_sessionsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sentri_users`: Exposes CRUD operations for the **sentri_users** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sentri_users
    * const sentri_users = await prisma.sentri_users.findMany()
    * ```
    */
  get sentri_users(): Prisma.sentri_usersDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    sentri_identifiers: 'sentri_identifiers',
    sentri_sessions: 'sentri_sessions',
    sentri_users: 'sentri_users'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "sentri_identifiers" | "sentri_sessions" | "sentri_users"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      sentri_identifiers: {
        payload: Prisma.$sentri_identifiersPayload<ExtArgs>
        fields: Prisma.sentri_identifiersFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sentri_identifiersFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sentri_identifiersFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          findFirst: {
            args: Prisma.sentri_identifiersFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sentri_identifiersFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          findMany: {
            args: Prisma.sentri_identifiersFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>[]
          }
          create: {
            args: Prisma.sentri_identifiersCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          createMany: {
            args: Prisma.sentri_identifiersCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sentri_identifiersCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>[]
          }
          delete: {
            args: Prisma.sentri_identifiersDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          update: {
            args: Prisma.sentri_identifiersUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          deleteMany: {
            args: Prisma.sentri_identifiersDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sentri_identifiersUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sentri_identifiersUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>[]
          }
          upsert: {
            args: Prisma.sentri_identifiersUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_identifiersPayload>
          }
          aggregate: {
            args: Prisma.Sentri_identifiersAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSentri_identifiers>
          }
          groupBy: {
            args: Prisma.sentri_identifiersGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sentri_identifiersGroupByOutputType>[]
          }
          count: {
            args: Prisma.sentri_identifiersCountArgs<ExtArgs>
            result: $Utils.Optional<Sentri_identifiersCountAggregateOutputType> | number
          }
        }
      }
      sentri_sessions: {
        payload: Prisma.$sentri_sessionsPayload<ExtArgs>
        fields: Prisma.sentri_sessionsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sentri_sessionsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sentri_sessionsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          findFirst: {
            args: Prisma.sentri_sessionsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sentri_sessionsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          findMany: {
            args: Prisma.sentri_sessionsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>[]
          }
          create: {
            args: Prisma.sentri_sessionsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          createMany: {
            args: Prisma.sentri_sessionsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sentri_sessionsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>[]
          }
          delete: {
            args: Prisma.sentri_sessionsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          update: {
            args: Prisma.sentri_sessionsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          deleteMany: {
            args: Prisma.sentri_sessionsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sentri_sessionsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sentri_sessionsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>[]
          }
          upsert: {
            args: Prisma.sentri_sessionsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_sessionsPayload>
          }
          aggregate: {
            args: Prisma.Sentri_sessionsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSentri_sessions>
          }
          groupBy: {
            args: Prisma.sentri_sessionsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sentri_sessionsGroupByOutputType>[]
          }
          count: {
            args: Prisma.sentri_sessionsCountArgs<ExtArgs>
            result: $Utils.Optional<Sentri_sessionsCountAggregateOutputType> | number
          }
        }
      }
      sentri_users: {
        payload: Prisma.$sentri_usersPayload<ExtArgs>
        fields: Prisma.sentri_usersFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sentri_usersFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sentri_usersFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          findFirst: {
            args: Prisma.sentri_usersFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sentri_usersFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          findMany: {
            args: Prisma.sentri_usersFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>[]
          }
          create: {
            args: Prisma.sentri_usersCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          createMany: {
            args: Prisma.sentri_usersCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sentri_usersCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>[]
          }
          delete: {
            args: Prisma.sentri_usersDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          update: {
            args: Prisma.sentri_usersUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          deleteMany: {
            args: Prisma.sentri_usersDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sentri_usersUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sentri_usersUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>[]
          }
          upsert: {
            args: Prisma.sentri_usersUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sentri_usersPayload>
          }
          aggregate: {
            args: Prisma.Sentri_usersAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSentri_users>
          }
          groupBy: {
            args: Prisma.sentri_usersGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sentri_usersGroupByOutputType>[]
          }
          count: {
            args: Prisma.sentri_usersCountArgs<ExtArgs>
            result: $Utils.Optional<Sentri_usersCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    sentri_identifiers?: sentri_identifiersOmit
    sentri_sessions?: sentri_sessionsOmit
    sentri_users?: sentri_usersOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type Sentri_usersCountOutputType
   */

  export type Sentri_usersCountOutputType = {
    sentri_identifiers: number
    sentri_sessions: number
  }

  export type Sentri_usersCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_identifiers?: boolean | Sentri_usersCountOutputTypeCountSentri_identifiersArgs
    sentri_sessions?: boolean | Sentri_usersCountOutputTypeCountSentri_sessionsArgs
  }

  // Custom InputTypes
  /**
   * Sentri_usersCountOutputType without action
   */
  export type Sentri_usersCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sentri_usersCountOutputType
     */
    select?: Sentri_usersCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * Sentri_usersCountOutputType without action
   */
  export type Sentri_usersCountOutputTypeCountSentri_identifiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sentri_identifiersWhereInput
  }

  /**
   * Sentri_usersCountOutputType without action
   */
  export type Sentri_usersCountOutputTypeCountSentri_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sentri_sessionsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model sentri_identifiers
   */

  export type AggregateSentri_identifiers = {
    _count: Sentri_identifiersCountAggregateOutputType | null
    _min: Sentri_identifiersMinAggregateOutputType | null
    _max: Sentri_identifiersMaxAggregateOutputType | null
  }

  export type Sentri_identifiersMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    type: string | null
    value: string | null
    created_at: Date | null
  }

  export type Sentri_identifiersMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    type: string | null
    value: string | null
    created_at: Date | null
  }

  export type Sentri_identifiersCountAggregateOutputType = {
    id: number
    user_id: number
    type: number
    value: number
    created_at: number
    _all: number
  }


  export type Sentri_identifiersMinAggregateInputType = {
    id?: true
    user_id?: true
    type?: true
    value?: true
    created_at?: true
  }

  export type Sentri_identifiersMaxAggregateInputType = {
    id?: true
    user_id?: true
    type?: true
    value?: true
    created_at?: true
  }

  export type Sentri_identifiersCountAggregateInputType = {
    id?: true
    user_id?: true
    type?: true
    value?: true
    created_at?: true
    _all?: true
  }

  export type Sentri_identifiersAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_identifiers to aggregate.
     */
    where?: sentri_identifiersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_identifiers to fetch.
     */
    orderBy?: sentri_identifiersOrderByWithRelationInput | sentri_identifiersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sentri_identifiersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_identifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_identifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sentri_identifiers
    **/
    _count?: true | Sentri_identifiersCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sentri_identifiersMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sentri_identifiersMaxAggregateInputType
  }

  export type GetSentri_identifiersAggregateType<T extends Sentri_identifiersAggregateArgs> = {
        [P in keyof T & keyof AggregateSentri_identifiers]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSentri_identifiers[P]>
      : GetScalarType<T[P], AggregateSentri_identifiers[P]>
  }




  export type sentri_identifiersGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sentri_identifiersWhereInput
    orderBy?: sentri_identifiersOrderByWithAggregationInput | sentri_identifiersOrderByWithAggregationInput[]
    by: Sentri_identifiersScalarFieldEnum[] | Sentri_identifiersScalarFieldEnum
    having?: sentri_identifiersScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sentri_identifiersCountAggregateInputType | true
    _min?: Sentri_identifiersMinAggregateInputType
    _max?: Sentri_identifiersMaxAggregateInputType
  }

  export type Sentri_identifiersGroupByOutputType = {
    id: string
    user_id: string
    type: string
    value: string
    created_at: Date
    _count: Sentri_identifiersCountAggregateOutputType | null
    _min: Sentri_identifiersMinAggregateOutputType | null
    _max: Sentri_identifiersMaxAggregateOutputType | null
  }

  type GetSentri_identifiersGroupByPayload<T extends sentri_identifiersGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sentri_identifiersGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sentri_identifiersGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sentri_identifiersGroupByOutputType[P]>
            : GetScalarType<T[P], Sentri_identifiersGroupByOutputType[P]>
        }
      >
    >


  export type sentri_identifiersSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    type?: boolean
    value?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_identifiers"]>

  export type sentri_identifiersSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    type?: boolean
    value?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_identifiers"]>

  export type sentri_identifiersSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    type?: boolean
    value?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_identifiers"]>

  export type sentri_identifiersSelectScalar = {
    id?: boolean
    user_id?: boolean
    type?: boolean
    value?: boolean
    created_at?: boolean
  }

  export type sentri_identifiersOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "type" | "value" | "created_at", ExtArgs["result"]["sentri_identifiers"]>
  export type sentri_identifiersInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }
  export type sentri_identifiersIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }
  export type sentri_identifiersIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }

  export type $sentri_identifiersPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sentri_identifiers"
    objects: {
      sentri_users: Prisma.$sentri_usersPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      type: string
      value: string
      created_at: Date
    }, ExtArgs["result"]["sentri_identifiers"]>
    composites: {}
  }

  type sentri_identifiersGetPayload<S extends boolean | null | undefined | sentri_identifiersDefaultArgs> = $Result.GetResult<Prisma.$sentri_identifiersPayload, S>

  type sentri_identifiersCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sentri_identifiersFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sentri_identifiersCountAggregateInputType | true
    }

  export interface sentri_identifiersDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sentri_identifiers'], meta: { name: 'sentri_identifiers' } }
    /**
     * Find zero or one Sentri_identifiers that matches the filter.
     * @param {sentri_identifiersFindUniqueArgs} args - Arguments to find a Sentri_identifiers
     * @example
     * // Get one Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sentri_identifiersFindUniqueArgs>(args: SelectSubset<T, sentri_identifiersFindUniqueArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sentri_identifiers that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sentri_identifiersFindUniqueOrThrowArgs} args - Arguments to find a Sentri_identifiers
     * @example
     * // Get one Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sentri_identifiersFindUniqueOrThrowArgs>(args: SelectSubset<T, sentri_identifiersFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_identifiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersFindFirstArgs} args - Arguments to find a Sentri_identifiers
     * @example
     * // Get one Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sentri_identifiersFindFirstArgs>(args?: SelectSubset<T, sentri_identifiersFindFirstArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_identifiers that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersFindFirstOrThrowArgs} args - Arguments to find a Sentri_identifiers
     * @example
     * // Get one Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sentri_identifiersFindFirstOrThrowArgs>(args?: SelectSubset<T, sentri_identifiersFindFirstOrThrowArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sentri_identifiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findMany()
     * 
     * // Get first 10 Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sentri_identifiersWithIdOnly = await prisma.sentri_identifiers.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sentri_identifiersFindManyArgs>(args?: SelectSubset<T, sentri_identifiersFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sentri_identifiers.
     * @param {sentri_identifiersCreateArgs} args - Arguments to create a Sentri_identifiers.
     * @example
     * // Create one Sentri_identifiers
     * const Sentri_identifiers = await prisma.sentri_identifiers.create({
     *   data: {
     *     // ... data to create a Sentri_identifiers
     *   }
     * })
     * 
     */
    create<T extends sentri_identifiersCreateArgs>(args: SelectSubset<T, sentri_identifiersCreateArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sentri_identifiers.
     * @param {sentri_identifiersCreateManyArgs} args - Arguments to create many Sentri_identifiers.
     * @example
     * // Create many Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sentri_identifiersCreateManyArgs>(args?: SelectSubset<T, sentri_identifiersCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sentri_identifiers and returns the data saved in the database.
     * @param {sentri_identifiersCreateManyAndReturnArgs} args - Arguments to create many Sentri_identifiers.
     * @example
     * // Create many Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sentri_identifiers and only return the `id`
     * const sentri_identifiersWithIdOnly = await prisma.sentri_identifiers.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sentri_identifiersCreateManyAndReturnArgs>(args?: SelectSubset<T, sentri_identifiersCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sentri_identifiers.
     * @param {sentri_identifiersDeleteArgs} args - Arguments to delete one Sentri_identifiers.
     * @example
     * // Delete one Sentri_identifiers
     * const Sentri_identifiers = await prisma.sentri_identifiers.delete({
     *   where: {
     *     // ... filter to delete one Sentri_identifiers
     *   }
     * })
     * 
     */
    delete<T extends sentri_identifiersDeleteArgs>(args: SelectSubset<T, sentri_identifiersDeleteArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sentri_identifiers.
     * @param {sentri_identifiersUpdateArgs} args - Arguments to update one Sentri_identifiers.
     * @example
     * // Update one Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sentri_identifiersUpdateArgs>(args: SelectSubset<T, sentri_identifiersUpdateArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sentri_identifiers.
     * @param {sentri_identifiersDeleteManyArgs} args - Arguments to filter Sentri_identifiers to delete.
     * @example
     * // Delete a few Sentri_identifiers
     * const { count } = await prisma.sentri_identifiers.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sentri_identifiersDeleteManyArgs>(args?: SelectSubset<T, sentri_identifiersDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_identifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sentri_identifiersUpdateManyArgs>(args: SelectSubset<T, sentri_identifiersUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_identifiers and returns the data updated in the database.
     * @param {sentri_identifiersUpdateManyAndReturnArgs} args - Arguments to update many Sentri_identifiers.
     * @example
     * // Update many Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sentri_identifiers and only return the `id`
     * const sentri_identifiersWithIdOnly = await prisma.sentri_identifiers.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sentri_identifiersUpdateManyAndReturnArgs>(args: SelectSubset<T, sentri_identifiersUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sentri_identifiers.
     * @param {sentri_identifiersUpsertArgs} args - Arguments to update or create a Sentri_identifiers.
     * @example
     * // Update or create a Sentri_identifiers
     * const sentri_identifiers = await prisma.sentri_identifiers.upsert({
     *   create: {
     *     // ... data to create a Sentri_identifiers
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sentri_identifiers we want to update
     *   }
     * })
     */
    upsert<T extends sentri_identifiersUpsertArgs>(args: SelectSubset<T, sentri_identifiersUpsertArgs<ExtArgs>>): Prisma__sentri_identifiersClient<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sentri_identifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersCountArgs} args - Arguments to filter Sentri_identifiers to count.
     * @example
     * // Count the number of Sentri_identifiers
     * const count = await prisma.sentri_identifiers.count({
     *   where: {
     *     // ... the filter for the Sentri_identifiers we want to count
     *   }
     * })
    **/
    count<T extends sentri_identifiersCountArgs>(
      args?: Subset<T, sentri_identifiersCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sentri_identifiersCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sentri_identifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sentri_identifiersAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sentri_identifiersAggregateArgs>(args: Subset<T, Sentri_identifiersAggregateArgs>): Prisma.PrismaPromise<GetSentri_identifiersAggregateType<T>>

    /**
     * Group by Sentri_identifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_identifiersGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sentri_identifiersGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sentri_identifiersGroupByArgs['orderBy'] }
        : { orderBy?: sentri_identifiersGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sentri_identifiersGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSentri_identifiersGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sentri_identifiers model
   */
  readonly fields: sentri_identifiersFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sentri_identifiers.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sentri_identifiersClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sentri_users<T extends sentri_usersDefaultArgs<ExtArgs> = {}>(args?: Subset<T, sentri_usersDefaultArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sentri_identifiers model
   */
  interface sentri_identifiersFieldRefs {
    readonly id: FieldRef<"sentri_identifiers", 'String'>
    readonly user_id: FieldRef<"sentri_identifiers", 'String'>
    readonly type: FieldRef<"sentri_identifiers", 'String'>
    readonly value: FieldRef<"sentri_identifiers", 'String'>
    readonly created_at: FieldRef<"sentri_identifiers", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sentri_identifiers findUnique
   */
  export type sentri_identifiersFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_identifiers to fetch.
     */
    where: sentri_identifiersWhereUniqueInput
  }

  /**
   * sentri_identifiers findUniqueOrThrow
   */
  export type sentri_identifiersFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_identifiers to fetch.
     */
    where: sentri_identifiersWhereUniqueInput
  }

  /**
   * sentri_identifiers findFirst
   */
  export type sentri_identifiersFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_identifiers to fetch.
     */
    where?: sentri_identifiersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_identifiers to fetch.
     */
    orderBy?: sentri_identifiersOrderByWithRelationInput | sentri_identifiersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_identifiers.
     */
    cursor?: sentri_identifiersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_identifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_identifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_identifiers.
     */
    distinct?: Sentri_identifiersScalarFieldEnum | Sentri_identifiersScalarFieldEnum[]
  }

  /**
   * sentri_identifiers findFirstOrThrow
   */
  export type sentri_identifiersFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_identifiers to fetch.
     */
    where?: sentri_identifiersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_identifiers to fetch.
     */
    orderBy?: sentri_identifiersOrderByWithRelationInput | sentri_identifiersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_identifiers.
     */
    cursor?: sentri_identifiersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_identifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_identifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_identifiers.
     */
    distinct?: Sentri_identifiersScalarFieldEnum | Sentri_identifiersScalarFieldEnum[]
  }

  /**
   * sentri_identifiers findMany
   */
  export type sentri_identifiersFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_identifiers to fetch.
     */
    where?: sentri_identifiersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_identifiers to fetch.
     */
    orderBy?: sentri_identifiersOrderByWithRelationInput | sentri_identifiersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sentri_identifiers.
     */
    cursor?: sentri_identifiersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_identifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_identifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_identifiers.
     */
    distinct?: Sentri_identifiersScalarFieldEnum | Sentri_identifiersScalarFieldEnum[]
  }

  /**
   * sentri_identifiers create
   */
  export type sentri_identifiersCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * The data needed to create a sentri_identifiers.
     */
    data: XOR<sentri_identifiersCreateInput, sentri_identifiersUncheckedCreateInput>
  }

  /**
   * sentri_identifiers createMany
   */
  export type sentri_identifiersCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sentri_identifiers.
     */
    data: sentri_identifiersCreateManyInput | sentri_identifiersCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sentri_identifiers createManyAndReturn
   */
  export type sentri_identifiersCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * The data used to create many sentri_identifiers.
     */
    data: sentri_identifiersCreateManyInput | sentri_identifiersCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * sentri_identifiers update
   */
  export type sentri_identifiersUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * The data needed to update a sentri_identifiers.
     */
    data: XOR<sentri_identifiersUpdateInput, sentri_identifiersUncheckedUpdateInput>
    /**
     * Choose, which sentri_identifiers to update.
     */
    where: sentri_identifiersWhereUniqueInput
  }

  /**
   * sentri_identifiers updateMany
   */
  export type sentri_identifiersUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sentri_identifiers.
     */
    data: XOR<sentri_identifiersUpdateManyMutationInput, sentri_identifiersUncheckedUpdateManyInput>
    /**
     * Filter which sentri_identifiers to update
     */
    where?: sentri_identifiersWhereInput
    /**
     * Limit how many sentri_identifiers to update.
     */
    limit?: number
  }

  /**
   * sentri_identifiers updateManyAndReturn
   */
  export type sentri_identifiersUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * The data used to update sentri_identifiers.
     */
    data: XOR<sentri_identifiersUpdateManyMutationInput, sentri_identifiersUncheckedUpdateManyInput>
    /**
     * Filter which sentri_identifiers to update
     */
    where?: sentri_identifiersWhereInput
    /**
     * Limit how many sentri_identifiers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * sentri_identifiers upsert
   */
  export type sentri_identifiersUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * The filter to search for the sentri_identifiers to update in case it exists.
     */
    where: sentri_identifiersWhereUniqueInput
    /**
     * In case the sentri_identifiers found by the `where` argument doesn't exist, create a new sentri_identifiers with this data.
     */
    create: XOR<sentri_identifiersCreateInput, sentri_identifiersUncheckedCreateInput>
    /**
     * In case the sentri_identifiers was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sentri_identifiersUpdateInput, sentri_identifiersUncheckedUpdateInput>
  }

  /**
   * sentri_identifiers delete
   */
  export type sentri_identifiersDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    /**
     * Filter which sentri_identifiers to delete.
     */
    where: sentri_identifiersWhereUniqueInput
  }

  /**
   * sentri_identifiers deleteMany
   */
  export type sentri_identifiersDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_identifiers to delete
     */
    where?: sentri_identifiersWhereInput
    /**
     * Limit how many sentri_identifiers to delete.
     */
    limit?: number
  }

  /**
   * sentri_identifiers without action
   */
  export type sentri_identifiersDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
  }


  /**
   * Model sentri_sessions
   */

  export type AggregateSentri_sessions = {
    _count: Sentri_sessionsCountAggregateOutputType | null
    _min: Sentri_sessionsMinAggregateOutputType | null
    _max: Sentri_sessionsMaxAggregateOutputType | null
  }

  export type Sentri_sessionsMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    expires_at: Date | null
    ip_address: string | null
    user_agent: string | null
    replaced_by: string | null
    created_at: Date | null
  }

  export type Sentri_sessionsMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    expires_at: Date | null
    ip_address: string | null
    user_agent: string | null
    replaced_by: string | null
    created_at: Date | null
  }

  export type Sentri_sessionsCountAggregateOutputType = {
    id: number
    user_id: number
    expires_at: number
    ip_address: number
    user_agent: number
    replaced_by: number
    created_at: number
    _all: number
  }


  export type Sentri_sessionsMinAggregateInputType = {
    id?: true
    user_id?: true
    expires_at?: true
    ip_address?: true
    user_agent?: true
    replaced_by?: true
    created_at?: true
  }

  export type Sentri_sessionsMaxAggregateInputType = {
    id?: true
    user_id?: true
    expires_at?: true
    ip_address?: true
    user_agent?: true
    replaced_by?: true
    created_at?: true
  }

  export type Sentri_sessionsCountAggregateInputType = {
    id?: true
    user_id?: true
    expires_at?: true
    ip_address?: true
    user_agent?: true
    replaced_by?: true
    created_at?: true
    _all?: true
  }

  export type Sentri_sessionsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_sessions to aggregate.
     */
    where?: sentri_sessionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_sessions to fetch.
     */
    orderBy?: sentri_sessionsOrderByWithRelationInput | sentri_sessionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sentri_sessionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sentri_sessions
    **/
    _count?: true | Sentri_sessionsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sentri_sessionsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sentri_sessionsMaxAggregateInputType
  }

  export type GetSentri_sessionsAggregateType<T extends Sentri_sessionsAggregateArgs> = {
        [P in keyof T & keyof AggregateSentri_sessions]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSentri_sessions[P]>
      : GetScalarType<T[P], AggregateSentri_sessions[P]>
  }




  export type sentri_sessionsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sentri_sessionsWhereInput
    orderBy?: sentri_sessionsOrderByWithAggregationInput | sentri_sessionsOrderByWithAggregationInput[]
    by: Sentri_sessionsScalarFieldEnum[] | Sentri_sessionsScalarFieldEnum
    having?: sentri_sessionsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sentri_sessionsCountAggregateInputType | true
    _min?: Sentri_sessionsMinAggregateInputType
    _max?: Sentri_sessionsMaxAggregateInputType
  }

  export type Sentri_sessionsGroupByOutputType = {
    id: string
    user_id: string
    expires_at: Date
    ip_address: string | null
    user_agent: string | null
    replaced_by: string | null
    created_at: Date
    _count: Sentri_sessionsCountAggregateOutputType | null
    _min: Sentri_sessionsMinAggregateOutputType | null
    _max: Sentri_sessionsMaxAggregateOutputType | null
  }

  type GetSentri_sessionsGroupByPayload<T extends sentri_sessionsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sentri_sessionsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sentri_sessionsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sentri_sessionsGroupByOutputType[P]>
            : GetScalarType<T[P], Sentri_sessionsGroupByOutputType[P]>
        }
      >
    >


  export type sentri_sessionsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    expires_at?: boolean
    ip_address?: boolean
    user_agent?: boolean
    replaced_by?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_sessions"]>

  export type sentri_sessionsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    expires_at?: boolean
    ip_address?: boolean
    user_agent?: boolean
    replaced_by?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_sessions"]>

  export type sentri_sessionsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    expires_at?: boolean
    ip_address?: boolean
    user_agent?: boolean
    replaced_by?: boolean
    created_at?: boolean
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_sessions"]>

  export type sentri_sessionsSelectScalar = {
    id?: boolean
    user_id?: boolean
    expires_at?: boolean
    ip_address?: boolean
    user_agent?: boolean
    replaced_by?: boolean
    created_at?: boolean
  }

  export type sentri_sessionsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "expires_at" | "ip_address" | "user_agent" | "replaced_by" | "created_at", ExtArgs["result"]["sentri_sessions"]>
  export type sentri_sessionsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }
  export type sentri_sessionsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }
  export type sentri_sessionsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_users?: boolean | sentri_usersDefaultArgs<ExtArgs>
  }

  export type $sentri_sessionsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sentri_sessions"
    objects: {
      sentri_users: Prisma.$sentri_usersPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      expires_at: Date
      ip_address: string | null
      user_agent: string | null
      replaced_by: string | null
      created_at: Date
    }, ExtArgs["result"]["sentri_sessions"]>
    composites: {}
  }

  type sentri_sessionsGetPayload<S extends boolean | null | undefined | sentri_sessionsDefaultArgs> = $Result.GetResult<Prisma.$sentri_sessionsPayload, S>

  type sentri_sessionsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sentri_sessionsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sentri_sessionsCountAggregateInputType | true
    }

  export interface sentri_sessionsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sentri_sessions'], meta: { name: 'sentri_sessions' } }
    /**
     * Find zero or one Sentri_sessions that matches the filter.
     * @param {sentri_sessionsFindUniqueArgs} args - Arguments to find a Sentri_sessions
     * @example
     * // Get one Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sentri_sessionsFindUniqueArgs>(args: SelectSubset<T, sentri_sessionsFindUniqueArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sentri_sessions that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sentri_sessionsFindUniqueOrThrowArgs} args - Arguments to find a Sentri_sessions
     * @example
     * // Get one Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sentri_sessionsFindUniqueOrThrowArgs>(args: SelectSubset<T, sentri_sessionsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsFindFirstArgs} args - Arguments to find a Sentri_sessions
     * @example
     * // Get one Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sentri_sessionsFindFirstArgs>(args?: SelectSubset<T, sentri_sessionsFindFirstArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_sessions that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsFindFirstOrThrowArgs} args - Arguments to find a Sentri_sessions
     * @example
     * // Get one Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sentri_sessionsFindFirstOrThrowArgs>(args?: SelectSubset<T, sentri_sessionsFindFirstOrThrowArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sentri_sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findMany()
     * 
     * // Get first 10 Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sentri_sessionsWithIdOnly = await prisma.sentri_sessions.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sentri_sessionsFindManyArgs>(args?: SelectSubset<T, sentri_sessionsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sentri_sessions.
     * @param {sentri_sessionsCreateArgs} args - Arguments to create a Sentri_sessions.
     * @example
     * // Create one Sentri_sessions
     * const Sentri_sessions = await prisma.sentri_sessions.create({
     *   data: {
     *     // ... data to create a Sentri_sessions
     *   }
     * })
     * 
     */
    create<T extends sentri_sessionsCreateArgs>(args: SelectSubset<T, sentri_sessionsCreateArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sentri_sessions.
     * @param {sentri_sessionsCreateManyArgs} args - Arguments to create many Sentri_sessions.
     * @example
     * // Create many Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sentri_sessionsCreateManyArgs>(args?: SelectSubset<T, sentri_sessionsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sentri_sessions and returns the data saved in the database.
     * @param {sentri_sessionsCreateManyAndReturnArgs} args - Arguments to create many Sentri_sessions.
     * @example
     * // Create many Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sentri_sessions and only return the `id`
     * const sentri_sessionsWithIdOnly = await prisma.sentri_sessions.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sentri_sessionsCreateManyAndReturnArgs>(args?: SelectSubset<T, sentri_sessionsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sentri_sessions.
     * @param {sentri_sessionsDeleteArgs} args - Arguments to delete one Sentri_sessions.
     * @example
     * // Delete one Sentri_sessions
     * const Sentri_sessions = await prisma.sentri_sessions.delete({
     *   where: {
     *     // ... filter to delete one Sentri_sessions
     *   }
     * })
     * 
     */
    delete<T extends sentri_sessionsDeleteArgs>(args: SelectSubset<T, sentri_sessionsDeleteArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sentri_sessions.
     * @param {sentri_sessionsUpdateArgs} args - Arguments to update one Sentri_sessions.
     * @example
     * // Update one Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sentri_sessionsUpdateArgs>(args: SelectSubset<T, sentri_sessionsUpdateArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sentri_sessions.
     * @param {sentri_sessionsDeleteManyArgs} args - Arguments to filter Sentri_sessions to delete.
     * @example
     * // Delete a few Sentri_sessions
     * const { count } = await prisma.sentri_sessions.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sentri_sessionsDeleteManyArgs>(args?: SelectSubset<T, sentri_sessionsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sentri_sessionsUpdateManyArgs>(args: SelectSubset<T, sentri_sessionsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_sessions and returns the data updated in the database.
     * @param {sentri_sessionsUpdateManyAndReturnArgs} args - Arguments to update many Sentri_sessions.
     * @example
     * // Update many Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sentri_sessions and only return the `id`
     * const sentri_sessionsWithIdOnly = await prisma.sentri_sessions.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sentri_sessionsUpdateManyAndReturnArgs>(args: SelectSubset<T, sentri_sessionsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sentri_sessions.
     * @param {sentri_sessionsUpsertArgs} args - Arguments to update or create a Sentri_sessions.
     * @example
     * // Update or create a Sentri_sessions
     * const sentri_sessions = await prisma.sentri_sessions.upsert({
     *   create: {
     *     // ... data to create a Sentri_sessions
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sentri_sessions we want to update
     *   }
     * })
     */
    upsert<T extends sentri_sessionsUpsertArgs>(args: SelectSubset<T, sentri_sessionsUpsertArgs<ExtArgs>>): Prisma__sentri_sessionsClient<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sentri_sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsCountArgs} args - Arguments to filter Sentri_sessions to count.
     * @example
     * // Count the number of Sentri_sessions
     * const count = await prisma.sentri_sessions.count({
     *   where: {
     *     // ... the filter for the Sentri_sessions we want to count
     *   }
     * })
    **/
    count<T extends sentri_sessionsCountArgs>(
      args?: Subset<T, sentri_sessionsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sentri_sessionsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sentri_sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sentri_sessionsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sentri_sessionsAggregateArgs>(args: Subset<T, Sentri_sessionsAggregateArgs>): Prisma.PrismaPromise<GetSentri_sessionsAggregateType<T>>

    /**
     * Group by Sentri_sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_sessionsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sentri_sessionsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sentri_sessionsGroupByArgs['orderBy'] }
        : { orderBy?: sentri_sessionsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sentri_sessionsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSentri_sessionsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sentri_sessions model
   */
  readonly fields: sentri_sessionsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sentri_sessions.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sentri_sessionsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sentri_users<T extends sentri_usersDefaultArgs<ExtArgs> = {}>(args?: Subset<T, sentri_usersDefaultArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sentri_sessions model
   */
  interface sentri_sessionsFieldRefs {
    readonly id: FieldRef<"sentri_sessions", 'String'>
    readonly user_id: FieldRef<"sentri_sessions", 'String'>
    readonly expires_at: FieldRef<"sentri_sessions", 'DateTime'>
    readonly ip_address: FieldRef<"sentri_sessions", 'String'>
    readonly user_agent: FieldRef<"sentri_sessions", 'String'>
    readonly replaced_by: FieldRef<"sentri_sessions", 'String'>
    readonly created_at: FieldRef<"sentri_sessions", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sentri_sessions findUnique
   */
  export type sentri_sessionsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter, which sentri_sessions to fetch.
     */
    where: sentri_sessionsWhereUniqueInput
  }

  /**
   * sentri_sessions findUniqueOrThrow
   */
  export type sentri_sessionsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter, which sentri_sessions to fetch.
     */
    where: sentri_sessionsWhereUniqueInput
  }

  /**
   * sentri_sessions findFirst
   */
  export type sentri_sessionsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter, which sentri_sessions to fetch.
     */
    where?: sentri_sessionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_sessions to fetch.
     */
    orderBy?: sentri_sessionsOrderByWithRelationInput | sentri_sessionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_sessions.
     */
    cursor?: sentri_sessionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_sessions.
     */
    distinct?: Sentri_sessionsScalarFieldEnum | Sentri_sessionsScalarFieldEnum[]
  }

  /**
   * sentri_sessions findFirstOrThrow
   */
  export type sentri_sessionsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter, which sentri_sessions to fetch.
     */
    where?: sentri_sessionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_sessions to fetch.
     */
    orderBy?: sentri_sessionsOrderByWithRelationInput | sentri_sessionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_sessions.
     */
    cursor?: sentri_sessionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_sessions.
     */
    distinct?: Sentri_sessionsScalarFieldEnum | Sentri_sessionsScalarFieldEnum[]
  }

  /**
   * sentri_sessions findMany
   */
  export type sentri_sessionsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter, which sentri_sessions to fetch.
     */
    where?: sentri_sessionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_sessions to fetch.
     */
    orderBy?: sentri_sessionsOrderByWithRelationInput | sentri_sessionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sentri_sessions.
     */
    cursor?: sentri_sessionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_sessions.
     */
    distinct?: Sentri_sessionsScalarFieldEnum | Sentri_sessionsScalarFieldEnum[]
  }

  /**
   * sentri_sessions create
   */
  export type sentri_sessionsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * The data needed to create a sentri_sessions.
     */
    data: XOR<sentri_sessionsCreateInput, sentri_sessionsUncheckedCreateInput>
  }

  /**
   * sentri_sessions createMany
   */
  export type sentri_sessionsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sentri_sessions.
     */
    data: sentri_sessionsCreateManyInput | sentri_sessionsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sentri_sessions createManyAndReturn
   */
  export type sentri_sessionsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * The data used to create many sentri_sessions.
     */
    data: sentri_sessionsCreateManyInput | sentri_sessionsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * sentri_sessions update
   */
  export type sentri_sessionsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * The data needed to update a sentri_sessions.
     */
    data: XOR<sentri_sessionsUpdateInput, sentri_sessionsUncheckedUpdateInput>
    /**
     * Choose, which sentri_sessions to update.
     */
    where: sentri_sessionsWhereUniqueInput
  }

  /**
   * sentri_sessions updateMany
   */
  export type sentri_sessionsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sentri_sessions.
     */
    data: XOR<sentri_sessionsUpdateManyMutationInput, sentri_sessionsUncheckedUpdateManyInput>
    /**
     * Filter which sentri_sessions to update
     */
    where?: sentri_sessionsWhereInput
    /**
     * Limit how many sentri_sessions to update.
     */
    limit?: number
  }

  /**
   * sentri_sessions updateManyAndReturn
   */
  export type sentri_sessionsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * The data used to update sentri_sessions.
     */
    data: XOR<sentri_sessionsUpdateManyMutationInput, sentri_sessionsUncheckedUpdateManyInput>
    /**
     * Filter which sentri_sessions to update
     */
    where?: sentri_sessionsWhereInput
    /**
     * Limit how many sentri_sessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * sentri_sessions upsert
   */
  export type sentri_sessionsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * The filter to search for the sentri_sessions to update in case it exists.
     */
    where: sentri_sessionsWhereUniqueInput
    /**
     * In case the sentri_sessions found by the `where` argument doesn't exist, create a new sentri_sessions with this data.
     */
    create: XOR<sentri_sessionsCreateInput, sentri_sessionsUncheckedCreateInput>
    /**
     * In case the sentri_sessions was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sentri_sessionsUpdateInput, sentri_sessionsUncheckedUpdateInput>
  }

  /**
   * sentri_sessions delete
   */
  export type sentri_sessionsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    /**
     * Filter which sentri_sessions to delete.
     */
    where: sentri_sessionsWhereUniqueInput
  }

  /**
   * sentri_sessions deleteMany
   */
  export type sentri_sessionsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_sessions to delete
     */
    where?: sentri_sessionsWhereInput
    /**
     * Limit how many sentri_sessions to delete.
     */
    limit?: number
  }

  /**
   * sentri_sessions without action
   */
  export type sentri_sessionsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
  }


  /**
   * Model sentri_users
   */

  export type AggregateSentri_users = {
    _count: Sentri_usersCountAggregateOutputType | null
    _min: Sentri_usersMinAggregateOutputType | null
    _max: Sentri_usersMaxAggregateOutputType | null
  }

  export type Sentri_usersMinAggregateOutputType = {
    id: string | null
    password_hash: string | null
    roles: string | null
    created_at: Date | null
  }

  export type Sentri_usersMaxAggregateOutputType = {
    id: string | null
    password_hash: string | null
    roles: string | null
    created_at: Date | null
  }

  export type Sentri_usersCountAggregateOutputType = {
    id: number
    password_hash: number
    roles: number
    created_at: number
    _all: number
  }


  export type Sentri_usersMinAggregateInputType = {
    id?: true
    password_hash?: true
    roles?: true
    created_at?: true
  }

  export type Sentri_usersMaxAggregateInputType = {
    id?: true
    password_hash?: true
    roles?: true
    created_at?: true
  }

  export type Sentri_usersCountAggregateInputType = {
    id?: true
    password_hash?: true
    roles?: true
    created_at?: true
    _all?: true
  }

  export type Sentri_usersAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_users to aggregate.
     */
    where?: sentri_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_users to fetch.
     */
    orderBy?: sentri_usersOrderByWithRelationInput | sentri_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sentri_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sentri_users
    **/
    _count?: true | Sentri_usersCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sentri_usersMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sentri_usersMaxAggregateInputType
  }

  export type GetSentri_usersAggregateType<T extends Sentri_usersAggregateArgs> = {
        [P in keyof T & keyof AggregateSentri_users]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSentri_users[P]>
      : GetScalarType<T[P], AggregateSentri_users[P]>
  }




  export type sentri_usersGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sentri_usersWhereInput
    orderBy?: sentri_usersOrderByWithAggregationInput | sentri_usersOrderByWithAggregationInput[]
    by: Sentri_usersScalarFieldEnum[] | Sentri_usersScalarFieldEnum
    having?: sentri_usersScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sentri_usersCountAggregateInputType | true
    _min?: Sentri_usersMinAggregateInputType
    _max?: Sentri_usersMaxAggregateInputType
  }

  export type Sentri_usersGroupByOutputType = {
    id: string
    password_hash: string
    roles: string
    created_at: Date
    _count: Sentri_usersCountAggregateOutputType | null
    _min: Sentri_usersMinAggregateOutputType | null
    _max: Sentri_usersMaxAggregateOutputType | null
  }

  type GetSentri_usersGroupByPayload<T extends sentri_usersGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sentri_usersGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sentri_usersGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sentri_usersGroupByOutputType[P]>
            : GetScalarType<T[P], Sentri_usersGroupByOutputType[P]>
        }
      >
    >


  export type sentri_usersSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    password_hash?: boolean
    roles?: boolean
    created_at?: boolean
    sentri_identifiers?: boolean | sentri_users$sentri_identifiersArgs<ExtArgs>
    sentri_sessions?: boolean | sentri_users$sentri_sessionsArgs<ExtArgs>
    _count?: boolean | Sentri_usersCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sentri_users"]>

  export type sentri_usersSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    password_hash?: boolean
    roles?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sentri_users"]>

  export type sentri_usersSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    password_hash?: boolean
    roles?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sentri_users"]>

  export type sentri_usersSelectScalar = {
    id?: boolean
    password_hash?: boolean
    roles?: boolean
    created_at?: boolean
  }

  export type sentri_usersOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "password_hash" | "roles" | "created_at", ExtArgs["result"]["sentri_users"]>
  export type sentri_usersInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sentri_identifiers?: boolean | sentri_users$sentri_identifiersArgs<ExtArgs>
    sentri_sessions?: boolean | sentri_users$sentri_sessionsArgs<ExtArgs>
    _count?: boolean | Sentri_usersCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type sentri_usersIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type sentri_usersIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $sentri_usersPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sentri_users"
    objects: {
      sentri_identifiers: Prisma.$sentri_identifiersPayload<ExtArgs>[]
      sentri_sessions: Prisma.$sentri_sessionsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      password_hash: string
      roles: string
      created_at: Date
    }, ExtArgs["result"]["sentri_users"]>
    composites: {}
  }

  type sentri_usersGetPayload<S extends boolean | null | undefined | sentri_usersDefaultArgs> = $Result.GetResult<Prisma.$sentri_usersPayload, S>

  type sentri_usersCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sentri_usersFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sentri_usersCountAggregateInputType | true
    }

  export interface sentri_usersDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sentri_users'], meta: { name: 'sentri_users' } }
    /**
     * Find zero or one Sentri_users that matches the filter.
     * @param {sentri_usersFindUniqueArgs} args - Arguments to find a Sentri_users
     * @example
     * // Get one Sentri_users
     * const sentri_users = await prisma.sentri_users.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sentri_usersFindUniqueArgs>(args: SelectSubset<T, sentri_usersFindUniqueArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sentri_users that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sentri_usersFindUniqueOrThrowArgs} args - Arguments to find a Sentri_users
     * @example
     * // Get one Sentri_users
     * const sentri_users = await prisma.sentri_users.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sentri_usersFindUniqueOrThrowArgs>(args: SelectSubset<T, sentri_usersFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersFindFirstArgs} args - Arguments to find a Sentri_users
     * @example
     * // Get one Sentri_users
     * const sentri_users = await prisma.sentri_users.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sentri_usersFindFirstArgs>(args?: SelectSubset<T, sentri_usersFindFirstArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sentri_users that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersFindFirstOrThrowArgs} args - Arguments to find a Sentri_users
     * @example
     * // Get one Sentri_users
     * const sentri_users = await prisma.sentri_users.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sentri_usersFindFirstOrThrowArgs>(args?: SelectSubset<T, sentri_usersFindFirstOrThrowArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sentri_users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sentri_users
     * const sentri_users = await prisma.sentri_users.findMany()
     * 
     * // Get first 10 Sentri_users
     * const sentri_users = await prisma.sentri_users.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sentri_usersWithIdOnly = await prisma.sentri_users.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sentri_usersFindManyArgs>(args?: SelectSubset<T, sentri_usersFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sentri_users.
     * @param {sentri_usersCreateArgs} args - Arguments to create a Sentri_users.
     * @example
     * // Create one Sentri_users
     * const Sentri_users = await prisma.sentri_users.create({
     *   data: {
     *     // ... data to create a Sentri_users
     *   }
     * })
     * 
     */
    create<T extends sentri_usersCreateArgs>(args: SelectSubset<T, sentri_usersCreateArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sentri_users.
     * @param {sentri_usersCreateManyArgs} args - Arguments to create many Sentri_users.
     * @example
     * // Create many Sentri_users
     * const sentri_users = await prisma.sentri_users.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sentri_usersCreateManyArgs>(args?: SelectSubset<T, sentri_usersCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sentri_users and returns the data saved in the database.
     * @param {sentri_usersCreateManyAndReturnArgs} args - Arguments to create many Sentri_users.
     * @example
     * // Create many Sentri_users
     * const sentri_users = await prisma.sentri_users.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sentri_users and only return the `id`
     * const sentri_usersWithIdOnly = await prisma.sentri_users.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sentri_usersCreateManyAndReturnArgs>(args?: SelectSubset<T, sentri_usersCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sentri_users.
     * @param {sentri_usersDeleteArgs} args - Arguments to delete one Sentri_users.
     * @example
     * // Delete one Sentri_users
     * const Sentri_users = await prisma.sentri_users.delete({
     *   where: {
     *     // ... filter to delete one Sentri_users
     *   }
     * })
     * 
     */
    delete<T extends sentri_usersDeleteArgs>(args: SelectSubset<T, sentri_usersDeleteArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sentri_users.
     * @param {sentri_usersUpdateArgs} args - Arguments to update one Sentri_users.
     * @example
     * // Update one Sentri_users
     * const sentri_users = await prisma.sentri_users.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sentri_usersUpdateArgs>(args: SelectSubset<T, sentri_usersUpdateArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sentri_users.
     * @param {sentri_usersDeleteManyArgs} args - Arguments to filter Sentri_users to delete.
     * @example
     * // Delete a few Sentri_users
     * const { count } = await prisma.sentri_users.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sentri_usersDeleteManyArgs>(args?: SelectSubset<T, sentri_usersDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sentri_users
     * const sentri_users = await prisma.sentri_users.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sentri_usersUpdateManyArgs>(args: SelectSubset<T, sentri_usersUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sentri_users and returns the data updated in the database.
     * @param {sentri_usersUpdateManyAndReturnArgs} args - Arguments to update many Sentri_users.
     * @example
     * // Update many Sentri_users
     * const sentri_users = await prisma.sentri_users.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sentri_users and only return the `id`
     * const sentri_usersWithIdOnly = await prisma.sentri_users.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sentri_usersUpdateManyAndReturnArgs>(args: SelectSubset<T, sentri_usersUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sentri_users.
     * @param {sentri_usersUpsertArgs} args - Arguments to update or create a Sentri_users.
     * @example
     * // Update or create a Sentri_users
     * const sentri_users = await prisma.sentri_users.upsert({
     *   create: {
     *     // ... data to create a Sentri_users
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sentri_users we want to update
     *   }
     * })
     */
    upsert<T extends sentri_usersUpsertArgs>(args: SelectSubset<T, sentri_usersUpsertArgs<ExtArgs>>): Prisma__sentri_usersClient<$Result.GetResult<Prisma.$sentri_usersPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sentri_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersCountArgs} args - Arguments to filter Sentri_users to count.
     * @example
     * // Count the number of Sentri_users
     * const count = await prisma.sentri_users.count({
     *   where: {
     *     // ... the filter for the Sentri_users we want to count
     *   }
     * })
    **/
    count<T extends sentri_usersCountArgs>(
      args?: Subset<T, sentri_usersCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sentri_usersCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sentri_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sentri_usersAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sentri_usersAggregateArgs>(args: Subset<T, Sentri_usersAggregateArgs>): Prisma.PrismaPromise<GetSentri_usersAggregateType<T>>

    /**
     * Group by Sentri_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sentri_usersGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sentri_usersGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sentri_usersGroupByArgs['orderBy'] }
        : { orderBy?: sentri_usersGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sentri_usersGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSentri_usersGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sentri_users model
   */
  readonly fields: sentri_usersFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sentri_users.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sentri_usersClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sentri_identifiers<T extends sentri_users$sentri_identifiersArgs<ExtArgs> = {}>(args?: Subset<T, sentri_users$sentri_identifiersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_identifiersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sentri_sessions<T extends sentri_users$sentri_sessionsArgs<ExtArgs> = {}>(args?: Subset<T, sentri_users$sentri_sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sentri_sessionsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sentri_users model
   */
  interface sentri_usersFieldRefs {
    readonly id: FieldRef<"sentri_users", 'String'>
    readonly password_hash: FieldRef<"sentri_users", 'String'>
    readonly roles: FieldRef<"sentri_users", 'String'>
    readonly created_at: FieldRef<"sentri_users", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sentri_users findUnique
   */
  export type sentri_usersFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_users to fetch.
     */
    where: sentri_usersWhereUniqueInput
  }

  /**
   * sentri_users findUniqueOrThrow
   */
  export type sentri_usersFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_users to fetch.
     */
    where: sentri_usersWhereUniqueInput
  }

  /**
   * sentri_users findFirst
   */
  export type sentri_usersFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_users to fetch.
     */
    where?: sentri_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_users to fetch.
     */
    orderBy?: sentri_usersOrderByWithRelationInput | sentri_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_users.
     */
    cursor?: sentri_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_users.
     */
    distinct?: Sentri_usersScalarFieldEnum | Sentri_usersScalarFieldEnum[]
  }

  /**
   * sentri_users findFirstOrThrow
   */
  export type sentri_usersFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_users to fetch.
     */
    where?: sentri_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_users to fetch.
     */
    orderBy?: sentri_usersOrderByWithRelationInput | sentri_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sentri_users.
     */
    cursor?: sentri_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_users.
     */
    distinct?: Sentri_usersScalarFieldEnum | Sentri_usersScalarFieldEnum[]
  }

  /**
   * sentri_users findMany
   */
  export type sentri_usersFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter, which sentri_users to fetch.
     */
    where?: sentri_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sentri_users to fetch.
     */
    orderBy?: sentri_usersOrderByWithRelationInput | sentri_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sentri_users.
     */
    cursor?: sentri_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sentri_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sentri_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sentri_users.
     */
    distinct?: Sentri_usersScalarFieldEnum | Sentri_usersScalarFieldEnum[]
  }

  /**
   * sentri_users create
   */
  export type sentri_usersCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * The data needed to create a sentri_users.
     */
    data: XOR<sentri_usersCreateInput, sentri_usersUncheckedCreateInput>
  }

  /**
   * sentri_users createMany
   */
  export type sentri_usersCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sentri_users.
     */
    data: sentri_usersCreateManyInput | sentri_usersCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sentri_users createManyAndReturn
   */
  export type sentri_usersCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * The data used to create many sentri_users.
     */
    data: sentri_usersCreateManyInput | sentri_usersCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sentri_users update
   */
  export type sentri_usersUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * The data needed to update a sentri_users.
     */
    data: XOR<sentri_usersUpdateInput, sentri_usersUncheckedUpdateInput>
    /**
     * Choose, which sentri_users to update.
     */
    where: sentri_usersWhereUniqueInput
  }

  /**
   * sentri_users updateMany
   */
  export type sentri_usersUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sentri_users.
     */
    data: XOR<sentri_usersUpdateManyMutationInput, sentri_usersUncheckedUpdateManyInput>
    /**
     * Filter which sentri_users to update
     */
    where?: sentri_usersWhereInput
    /**
     * Limit how many sentri_users to update.
     */
    limit?: number
  }

  /**
   * sentri_users updateManyAndReturn
   */
  export type sentri_usersUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * The data used to update sentri_users.
     */
    data: XOR<sentri_usersUpdateManyMutationInput, sentri_usersUncheckedUpdateManyInput>
    /**
     * Filter which sentri_users to update
     */
    where?: sentri_usersWhereInput
    /**
     * Limit how many sentri_users to update.
     */
    limit?: number
  }

  /**
   * sentri_users upsert
   */
  export type sentri_usersUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * The filter to search for the sentri_users to update in case it exists.
     */
    where: sentri_usersWhereUniqueInput
    /**
     * In case the sentri_users found by the `where` argument doesn't exist, create a new sentri_users with this data.
     */
    create: XOR<sentri_usersCreateInput, sentri_usersUncheckedCreateInput>
    /**
     * In case the sentri_users was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sentri_usersUpdateInput, sentri_usersUncheckedUpdateInput>
  }

  /**
   * sentri_users delete
   */
  export type sentri_usersDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
    /**
     * Filter which sentri_users to delete.
     */
    where: sentri_usersWhereUniqueInput
  }

  /**
   * sentri_users deleteMany
   */
  export type sentri_usersDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sentri_users to delete
     */
    where?: sentri_usersWhereInput
    /**
     * Limit how many sentri_users to delete.
     */
    limit?: number
  }

  /**
   * sentri_users.sentri_identifiers
   */
  export type sentri_users$sentri_identifiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_identifiers
     */
    select?: sentri_identifiersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_identifiers
     */
    omit?: sentri_identifiersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_identifiersInclude<ExtArgs> | null
    where?: sentri_identifiersWhereInput
    orderBy?: sentri_identifiersOrderByWithRelationInput | sentri_identifiersOrderByWithRelationInput[]
    cursor?: sentri_identifiersWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Sentri_identifiersScalarFieldEnum | Sentri_identifiersScalarFieldEnum[]
  }

  /**
   * sentri_users.sentri_sessions
   */
  export type sentri_users$sentri_sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_sessions
     */
    select?: sentri_sessionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_sessions
     */
    omit?: sentri_sessionsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_sessionsInclude<ExtArgs> | null
    where?: sentri_sessionsWhereInput
    orderBy?: sentri_sessionsOrderByWithRelationInput | sentri_sessionsOrderByWithRelationInput[]
    cursor?: sentri_sessionsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Sentri_sessionsScalarFieldEnum | Sentri_sessionsScalarFieldEnum[]
  }

  /**
   * sentri_users without action
   */
  export type sentri_usersDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sentri_users
     */
    select?: sentri_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sentri_users
     */
    omit?: sentri_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sentri_usersInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const Sentri_identifiersScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    type: 'type',
    value: 'value',
    created_at: 'created_at'
  };

  export type Sentri_identifiersScalarFieldEnum = (typeof Sentri_identifiersScalarFieldEnum)[keyof typeof Sentri_identifiersScalarFieldEnum]


  export const Sentri_sessionsScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    expires_at: 'expires_at',
    ip_address: 'ip_address',
    user_agent: 'user_agent',
    replaced_by: 'replaced_by',
    created_at: 'created_at'
  };

  export type Sentri_sessionsScalarFieldEnum = (typeof Sentri_sessionsScalarFieldEnum)[keyof typeof Sentri_sessionsScalarFieldEnum]


  export const Sentri_usersScalarFieldEnum: {
    id: 'id',
    password_hash: 'password_hash',
    roles: 'roles',
    created_at: 'created_at'
  };

  export type Sentri_usersScalarFieldEnum = (typeof Sentri_usersScalarFieldEnum)[keyof typeof Sentri_usersScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type sentri_identifiersWhereInput = {
    AND?: sentri_identifiersWhereInput | sentri_identifiersWhereInput[]
    OR?: sentri_identifiersWhereInput[]
    NOT?: sentri_identifiersWhereInput | sentri_identifiersWhereInput[]
    id?: StringFilter<"sentri_identifiers"> | string
    user_id?: StringFilter<"sentri_identifiers"> | string
    type?: StringFilter<"sentri_identifiers"> | string
    value?: StringFilter<"sentri_identifiers"> | string
    created_at?: DateTimeFilter<"sentri_identifiers"> | Date | string
    sentri_users?: XOR<Sentri_usersScalarRelationFilter, sentri_usersWhereInput>
  }

  export type sentri_identifiersOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    value?: SortOrder
    created_at?: SortOrder
    sentri_users?: sentri_usersOrderByWithRelationInput
  }

  export type sentri_identifiersWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    value?: string
    user_id_type?: sentri_identifiersUser_idTypeCompoundUniqueInput
    AND?: sentri_identifiersWhereInput | sentri_identifiersWhereInput[]
    OR?: sentri_identifiersWhereInput[]
    NOT?: sentri_identifiersWhereInput | sentri_identifiersWhereInput[]
    user_id?: StringFilter<"sentri_identifiers"> | string
    type?: StringFilter<"sentri_identifiers"> | string
    created_at?: DateTimeFilter<"sentri_identifiers"> | Date | string
    sentri_users?: XOR<Sentri_usersScalarRelationFilter, sentri_usersWhereInput>
  }, "id" | "value" | "user_id_type">

  export type sentri_identifiersOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    value?: SortOrder
    created_at?: SortOrder
    _count?: sentri_identifiersCountOrderByAggregateInput
    _max?: sentri_identifiersMaxOrderByAggregateInput
    _min?: sentri_identifiersMinOrderByAggregateInput
  }

  export type sentri_identifiersScalarWhereWithAggregatesInput = {
    AND?: sentri_identifiersScalarWhereWithAggregatesInput | sentri_identifiersScalarWhereWithAggregatesInput[]
    OR?: sentri_identifiersScalarWhereWithAggregatesInput[]
    NOT?: sentri_identifiersScalarWhereWithAggregatesInput | sentri_identifiersScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"sentri_identifiers"> | string
    user_id?: StringWithAggregatesFilter<"sentri_identifiers"> | string
    type?: StringWithAggregatesFilter<"sentri_identifiers"> | string
    value?: StringWithAggregatesFilter<"sentri_identifiers"> | string
    created_at?: DateTimeWithAggregatesFilter<"sentri_identifiers"> | Date | string
  }

  export type sentri_sessionsWhereInput = {
    AND?: sentri_sessionsWhereInput | sentri_sessionsWhereInput[]
    OR?: sentri_sessionsWhereInput[]
    NOT?: sentri_sessionsWhereInput | sentri_sessionsWhereInput[]
    id?: StringFilter<"sentri_sessions"> | string
    user_id?: StringFilter<"sentri_sessions"> | string
    expires_at?: DateTimeFilter<"sentri_sessions"> | Date | string
    ip_address?: StringNullableFilter<"sentri_sessions"> | string | null
    user_agent?: StringNullableFilter<"sentri_sessions"> | string | null
    replaced_by?: StringNullableFilter<"sentri_sessions"> | string | null
    created_at?: DateTimeFilter<"sentri_sessions"> | Date | string
    sentri_users?: XOR<Sentri_usersScalarRelationFilter, sentri_usersWhereInput>
  }

  export type sentri_sessionsOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    replaced_by?: SortOrderInput | SortOrder
    created_at?: SortOrder
    sentri_users?: sentri_usersOrderByWithRelationInput
  }

  export type sentri_sessionsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: sentri_sessionsWhereInput | sentri_sessionsWhereInput[]
    OR?: sentri_sessionsWhereInput[]
    NOT?: sentri_sessionsWhereInput | sentri_sessionsWhereInput[]
    user_id?: StringFilter<"sentri_sessions"> | string
    expires_at?: DateTimeFilter<"sentri_sessions"> | Date | string
    ip_address?: StringNullableFilter<"sentri_sessions"> | string | null
    user_agent?: StringNullableFilter<"sentri_sessions"> | string | null
    replaced_by?: StringNullableFilter<"sentri_sessions"> | string | null
    created_at?: DateTimeFilter<"sentri_sessions"> | Date | string
    sentri_users?: XOR<Sentri_usersScalarRelationFilter, sentri_usersWhereInput>
  }, "id">

  export type sentri_sessionsOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    replaced_by?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: sentri_sessionsCountOrderByAggregateInput
    _max?: sentri_sessionsMaxOrderByAggregateInput
    _min?: sentri_sessionsMinOrderByAggregateInput
  }

  export type sentri_sessionsScalarWhereWithAggregatesInput = {
    AND?: sentri_sessionsScalarWhereWithAggregatesInput | sentri_sessionsScalarWhereWithAggregatesInput[]
    OR?: sentri_sessionsScalarWhereWithAggregatesInput[]
    NOT?: sentri_sessionsScalarWhereWithAggregatesInput | sentri_sessionsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"sentri_sessions"> | string
    user_id?: StringWithAggregatesFilter<"sentri_sessions"> | string
    expires_at?: DateTimeWithAggregatesFilter<"sentri_sessions"> | Date | string
    ip_address?: StringNullableWithAggregatesFilter<"sentri_sessions"> | string | null
    user_agent?: StringNullableWithAggregatesFilter<"sentri_sessions"> | string | null
    replaced_by?: StringNullableWithAggregatesFilter<"sentri_sessions"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"sentri_sessions"> | Date | string
  }

  export type sentri_usersWhereInput = {
    AND?: sentri_usersWhereInput | sentri_usersWhereInput[]
    OR?: sentri_usersWhereInput[]
    NOT?: sentri_usersWhereInput | sentri_usersWhereInput[]
    id?: StringFilter<"sentri_users"> | string
    password_hash?: StringFilter<"sentri_users"> | string
    roles?: StringFilter<"sentri_users"> | string
    created_at?: DateTimeFilter<"sentri_users"> | Date | string
    sentri_identifiers?: Sentri_identifiersListRelationFilter
    sentri_sessions?: Sentri_sessionsListRelationFilter
  }

  export type sentri_usersOrderByWithRelationInput = {
    id?: SortOrder
    password_hash?: SortOrder
    roles?: SortOrder
    created_at?: SortOrder
    sentri_identifiers?: sentri_identifiersOrderByRelationAggregateInput
    sentri_sessions?: sentri_sessionsOrderByRelationAggregateInput
  }

  export type sentri_usersWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: sentri_usersWhereInput | sentri_usersWhereInput[]
    OR?: sentri_usersWhereInput[]
    NOT?: sentri_usersWhereInput | sentri_usersWhereInput[]
    password_hash?: StringFilter<"sentri_users"> | string
    roles?: StringFilter<"sentri_users"> | string
    created_at?: DateTimeFilter<"sentri_users"> | Date | string
    sentri_identifiers?: Sentri_identifiersListRelationFilter
    sentri_sessions?: Sentri_sessionsListRelationFilter
  }, "id">

  export type sentri_usersOrderByWithAggregationInput = {
    id?: SortOrder
    password_hash?: SortOrder
    roles?: SortOrder
    created_at?: SortOrder
    _count?: sentri_usersCountOrderByAggregateInput
    _max?: sentri_usersMaxOrderByAggregateInput
    _min?: sentri_usersMinOrderByAggregateInput
  }

  export type sentri_usersScalarWhereWithAggregatesInput = {
    AND?: sentri_usersScalarWhereWithAggregatesInput | sentri_usersScalarWhereWithAggregatesInput[]
    OR?: sentri_usersScalarWhereWithAggregatesInput[]
    NOT?: sentri_usersScalarWhereWithAggregatesInput | sentri_usersScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"sentri_users"> | string
    password_hash?: StringWithAggregatesFilter<"sentri_users"> | string
    roles?: StringWithAggregatesFilter<"sentri_users"> | string
    created_at?: DateTimeWithAggregatesFilter<"sentri_users"> | Date | string
  }

  export type sentri_identifiersCreateInput = {
    id: string
    type: string
    value: string
    created_at?: Date | string
    sentri_users: sentri_usersCreateNestedOneWithoutSentri_identifiersInput
  }

  export type sentri_identifiersUncheckedCreateInput = {
    id: string
    user_id: string
    type: string
    value: string
    created_at?: Date | string
  }

  export type sentri_identifiersUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_users?: sentri_usersUpdateOneRequiredWithoutSentri_identifiersNestedInput
  }

  export type sentri_identifiersUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_identifiersCreateManyInput = {
    id: string
    user_id: string
    type: string
    value: string
    created_at?: Date | string
  }

  export type sentri_identifiersUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_identifiersUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsCreateInput = {
    id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
    sentri_users: sentri_usersCreateNestedOneWithoutSentri_sessionsInput
  }

  export type sentri_sessionsUncheckedCreateInput = {
    id: string
    user_id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
  }

  export type sentri_sessionsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_users?: sentri_usersUpdateOneRequiredWithoutSentri_sessionsNestedInput
  }

  export type sentri_sessionsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsCreateManyInput = {
    id: string
    user_id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
  }

  export type sentri_sessionsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_usersCreateInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_identifiers?: sentri_identifiersCreateNestedManyWithoutSentri_usersInput
    sentri_sessions?: sentri_sessionsCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersUncheckedCreateInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_identifiers?: sentri_identifiersUncheckedCreateNestedManyWithoutSentri_usersInput
    sentri_sessions?: sentri_sessionsUncheckedCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_identifiers?: sentri_identifiersUpdateManyWithoutSentri_usersNestedInput
    sentri_sessions?: sentri_sessionsUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_usersUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_identifiers?: sentri_identifiersUncheckedUpdateManyWithoutSentri_usersNestedInput
    sentri_sessions?: sentri_sessionsUncheckedUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_usersCreateManyInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
  }

  export type sentri_usersUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_usersUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type Sentri_usersScalarRelationFilter = {
    is?: sentri_usersWhereInput
    isNot?: sentri_usersWhereInput
  }

  export type sentri_identifiersUser_idTypeCompoundUniqueInput = {
    user_id: string
    type: string
  }

  export type sentri_identifiersCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    value?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_identifiersMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    value?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_identifiersMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    type?: SortOrder
    value?: SortOrder
    created_at?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type sentri_sessionsCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    replaced_by?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_sessionsMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    replaced_by?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_sessionsMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    expires_at?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    replaced_by?: SortOrder
    created_at?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type Sentri_identifiersListRelationFilter = {
    every?: sentri_identifiersWhereInput
    some?: sentri_identifiersWhereInput
    none?: sentri_identifiersWhereInput
  }

  export type Sentri_sessionsListRelationFilter = {
    every?: sentri_sessionsWhereInput
    some?: sentri_sessionsWhereInput
    none?: sentri_sessionsWhereInput
  }

  export type sentri_identifiersOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type sentri_sessionsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type sentri_usersCountOrderByAggregateInput = {
    id?: SortOrder
    password_hash?: SortOrder
    roles?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_usersMaxOrderByAggregateInput = {
    id?: SortOrder
    password_hash?: SortOrder
    roles?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_usersMinOrderByAggregateInput = {
    id?: SortOrder
    password_hash?: SortOrder
    roles?: SortOrder
    created_at?: SortOrder
  }

  export type sentri_usersCreateNestedOneWithoutSentri_identifiersInput = {
    create?: XOR<sentri_usersCreateWithoutSentri_identifiersInput, sentri_usersUncheckedCreateWithoutSentri_identifiersInput>
    connectOrCreate?: sentri_usersCreateOrConnectWithoutSentri_identifiersInput
    connect?: sentri_usersWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type sentri_usersUpdateOneRequiredWithoutSentri_identifiersNestedInput = {
    create?: XOR<sentri_usersCreateWithoutSentri_identifiersInput, sentri_usersUncheckedCreateWithoutSentri_identifiersInput>
    connectOrCreate?: sentri_usersCreateOrConnectWithoutSentri_identifiersInput
    upsert?: sentri_usersUpsertWithoutSentri_identifiersInput
    connect?: sentri_usersWhereUniqueInput
    update?: XOR<XOR<sentri_usersUpdateToOneWithWhereWithoutSentri_identifiersInput, sentri_usersUpdateWithoutSentri_identifiersInput>, sentri_usersUncheckedUpdateWithoutSentri_identifiersInput>
  }

  export type sentri_usersCreateNestedOneWithoutSentri_sessionsInput = {
    create?: XOR<sentri_usersCreateWithoutSentri_sessionsInput, sentri_usersUncheckedCreateWithoutSentri_sessionsInput>
    connectOrCreate?: sentri_usersCreateOrConnectWithoutSentri_sessionsInput
    connect?: sentri_usersWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type sentri_usersUpdateOneRequiredWithoutSentri_sessionsNestedInput = {
    create?: XOR<sentri_usersCreateWithoutSentri_sessionsInput, sentri_usersUncheckedCreateWithoutSentri_sessionsInput>
    connectOrCreate?: sentri_usersCreateOrConnectWithoutSentri_sessionsInput
    upsert?: sentri_usersUpsertWithoutSentri_sessionsInput
    connect?: sentri_usersWhereUniqueInput
    update?: XOR<XOR<sentri_usersUpdateToOneWithWhereWithoutSentri_sessionsInput, sentri_usersUpdateWithoutSentri_sessionsInput>, sentri_usersUncheckedUpdateWithoutSentri_sessionsInput>
  }

  export type sentri_identifiersCreateNestedManyWithoutSentri_usersInput = {
    create?: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput> | sentri_identifiersCreateWithoutSentri_usersInput[] | sentri_identifiersUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_identifiersCreateOrConnectWithoutSentri_usersInput | sentri_identifiersCreateOrConnectWithoutSentri_usersInput[]
    createMany?: sentri_identifiersCreateManySentri_usersInputEnvelope
    connect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
  }

  export type sentri_sessionsCreateNestedManyWithoutSentri_usersInput = {
    create?: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput> | sentri_sessionsCreateWithoutSentri_usersInput[] | sentri_sessionsUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_sessionsCreateOrConnectWithoutSentri_usersInput | sentri_sessionsCreateOrConnectWithoutSentri_usersInput[]
    createMany?: sentri_sessionsCreateManySentri_usersInputEnvelope
    connect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
  }

  export type sentri_identifiersUncheckedCreateNestedManyWithoutSentri_usersInput = {
    create?: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput> | sentri_identifiersCreateWithoutSentri_usersInput[] | sentri_identifiersUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_identifiersCreateOrConnectWithoutSentri_usersInput | sentri_identifiersCreateOrConnectWithoutSentri_usersInput[]
    createMany?: sentri_identifiersCreateManySentri_usersInputEnvelope
    connect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
  }

  export type sentri_sessionsUncheckedCreateNestedManyWithoutSentri_usersInput = {
    create?: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput> | sentri_sessionsCreateWithoutSentri_usersInput[] | sentri_sessionsUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_sessionsCreateOrConnectWithoutSentri_usersInput | sentri_sessionsCreateOrConnectWithoutSentri_usersInput[]
    createMany?: sentri_sessionsCreateManySentri_usersInputEnvelope
    connect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
  }

  export type sentri_identifiersUpdateManyWithoutSentri_usersNestedInput = {
    create?: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput> | sentri_identifiersCreateWithoutSentri_usersInput[] | sentri_identifiersUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_identifiersCreateOrConnectWithoutSentri_usersInput | sentri_identifiersCreateOrConnectWithoutSentri_usersInput[]
    upsert?: sentri_identifiersUpsertWithWhereUniqueWithoutSentri_usersInput | sentri_identifiersUpsertWithWhereUniqueWithoutSentri_usersInput[]
    createMany?: sentri_identifiersCreateManySentri_usersInputEnvelope
    set?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    disconnect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    delete?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    connect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    update?: sentri_identifiersUpdateWithWhereUniqueWithoutSentri_usersInput | sentri_identifiersUpdateWithWhereUniqueWithoutSentri_usersInput[]
    updateMany?: sentri_identifiersUpdateManyWithWhereWithoutSentri_usersInput | sentri_identifiersUpdateManyWithWhereWithoutSentri_usersInput[]
    deleteMany?: sentri_identifiersScalarWhereInput | sentri_identifiersScalarWhereInput[]
  }

  export type sentri_sessionsUpdateManyWithoutSentri_usersNestedInput = {
    create?: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput> | sentri_sessionsCreateWithoutSentri_usersInput[] | sentri_sessionsUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_sessionsCreateOrConnectWithoutSentri_usersInput | sentri_sessionsCreateOrConnectWithoutSentri_usersInput[]
    upsert?: sentri_sessionsUpsertWithWhereUniqueWithoutSentri_usersInput | sentri_sessionsUpsertWithWhereUniqueWithoutSentri_usersInput[]
    createMany?: sentri_sessionsCreateManySentri_usersInputEnvelope
    set?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    disconnect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    delete?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    connect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    update?: sentri_sessionsUpdateWithWhereUniqueWithoutSentri_usersInput | sentri_sessionsUpdateWithWhereUniqueWithoutSentri_usersInput[]
    updateMany?: sentri_sessionsUpdateManyWithWhereWithoutSentri_usersInput | sentri_sessionsUpdateManyWithWhereWithoutSentri_usersInput[]
    deleteMany?: sentri_sessionsScalarWhereInput | sentri_sessionsScalarWhereInput[]
  }

  export type sentri_identifiersUncheckedUpdateManyWithoutSentri_usersNestedInput = {
    create?: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput> | sentri_identifiersCreateWithoutSentri_usersInput[] | sentri_identifiersUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_identifiersCreateOrConnectWithoutSentri_usersInput | sentri_identifiersCreateOrConnectWithoutSentri_usersInput[]
    upsert?: sentri_identifiersUpsertWithWhereUniqueWithoutSentri_usersInput | sentri_identifiersUpsertWithWhereUniqueWithoutSentri_usersInput[]
    createMany?: sentri_identifiersCreateManySentri_usersInputEnvelope
    set?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    disconnect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    delete?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    connect?: sentri_identifiersWhereUniqueInput | sentri_identifiersWhereUniqueInput[]
    update?: sentri_identifiersUpdateWithWhereUniqueWithoutSentri_usersInput | sentri_identifiersUpdateWithWhereUniqueWithoutSentri_usersInput[]
    updateMany?: sentri_identifiersUpdateManyWithWhereWithoutSentri_usersInput | sentri_identifiersUpdateManyWithWhereWithoutSentri_usersInput[]
    deleteMany?: sentri_identifiersScalarWhereInput | sentri_identifiersScalarWhereInput[]
  }

  export type sentri_sessionsUncheckedUpdateManyWithoutSentri_usersNestedInput = {
    create?: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput> | sentri_sessionsCreateWithoutSentri_usersInput[] | sentri_sessionsUncheckedCreateWithoutSentri_usersInput[]
    connectOrCreate?: sentri_sessionsCreateOrConnectWithoutSentri_usersInput | sentri_sessionsCreateOrConnectWithoutSentri_usersInput[]
    upsert?: sentri_sessionsUpsertWithWhereUniqueWithoutSentri_usersInput | sentri_sessionsUpsertWithWhereUniqueWithoutSentri_usersInput[]
    createMany?: sentri_sessionsCreateManySentri_usersInputEnvelope
    set?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    disconnect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    delete?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    connect?: sentri_sessionsWhereUniqueInput | sentri_sessionsWhereUniqueInput[]
    update?: sentri_sessionsUpdateWithWhereUniqueWithoutSentri_usersInput | sentri_sessionsUpdateWithWhereUniqueWithoutSentri_usersInput[]
    updateMany?: sentri_sessionsUpdateManyWithWhereWithoutSentri_usersInput | sentri_sessionsUpdateManyWithWhereWithoutSentri_usersInput[]
    deleteMany?: sentri_sessionsScalarWhereInput | sentri_sessionsScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type sentri_usersCreateWithoutSentri_identifiersInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_sessions?: sentri_sessionsCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersUncheckedCreateWithoutSentri_identifiersInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_sessions?: sentri_sessionsUncheckedCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersCreateOrConnectWithoutSentri_identifiersInput = {
    where: sentri_usersWhereUniqueInput
    create: XOR<sentri_usersCreateWithoutSentri_identifiersInput, sentri_usersUncheckedCreateWithoutSentri_identifiersInput>
  }

  export type sentri_usersUpsertWithoutSentri_identifiersInput = {
    update: XOR<sentri_usersUpdateWithoutSentri_identifiersInput, sentri_usersUncheckedUpdateWithoutSentri_identifiersInput>
    create: XOR<sentri_usersCreateWithoutSentri_identifiersInput, sentri_usersUncheckedCreateWithoutSentri_identifiersInput>
    where?: sentri_usersWhereInput
  }

  export type sentri_usersUpdateToOneWithWhereWithoutSentri_identifiersInput = {
    where?: sentri_usersWhereInput
    data: XOR<sentri_usersUpdateWithoutSentri_identifiersInput, sentri_usersUncheckedUpdateWithoutSentri_identifiersInput>
  }

  export type sentri_usersUpdateWithoutSentri_identifiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_sessions?: sentri_sessionsUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_usersUncheckedUpdateWithoutSentri_identifiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_sessions?: sentri_sessionsUncheckedUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_usersCreateWithoutSentri_sessionsInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_identifiers?: sentri_identifiersCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersUncheckedCreateWithoutSentri_sessionsInput = {
    id: string
    password_hash: string
    roles?: string
    created_at?: Date | string
    sentri_identifiers?: sentri_identifiersUncheckedCreateNestedManyWithoutSentri_usersInput
  }

  export type sentri_usersCreateOrConnectWithoutSentri_sessionsInput = {
    where: sentri_usersWhereUniqueInput
    create: XOR<sentri_usersCreateWithoutSentri_sessionsInput, sentri_usersUncheckedCreateWithoutSentri_sessionsInput>
  }

  export type sentri_usersUpsertWithoutSentri_sessionsInput = {
    update: XOR<sentri_usersUpdateWithoutSentri_sessionsInput, sentri_usersUncheckedUpdateWithoutSentri_sessionsInput>
    create: XOR<sentri_usersCreateWithoutSentri_sessionsInput, sentri_usersUncheckedCreateWithoutSentri_sessionsInput>
    where?: sentri_usersWhereInput
  }

  export type sentri_usersUpdateToOneWithWhereWithoutSentri_sessionsInput = {
    where?: sentri_usersWhereInput
    data: XOR<sentri_usersUpdateWithoutSentri_sessionsInput, sentri_usersUncheckedUpdateWithoutSentri_sessionsInput>
  }

  export type sentri_usersUpdateWithoutSentri_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_identifiers?: sentri_identifiersUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_usersUncheckedUpdateWithoutSentri_sessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    password_hash?: StringFieldUpdateOperationsInput | string
    roles?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    sentri_identifiers?: sentri_identifiersUncheckedUpdateManyWithoutSentri_usersNestedInput
  }

  export type sentri_identifiersCreateWithoutSentri_usersInput = {
    id: string
    type: string
    value: string
    created_at?: Date | string
  }

  export type sentri_identifiersUncheckedCreateWithoutSentri_usersInput = {
    id: string
    type: string
    value: string
    created_at?: Date | string
  }

  export type sentri_identifiersCreateOrConnectWithoutSentri_usersInput = {
    where: sentri_identifiersWhereUniqueInput
    create: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput>
  }

  export type sentri_identifiersCreateManySentri_usersInputEnvelope = {
    data: sentri_identifiersCreateManySentri_usersInput | sentri_identifiersCreateManySentri_usersInput[]
    skipDuplicates?: boolean
  }

  export type sentri_sessionsCreateWithoutSentri_usersInput = {
    id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
  }

  export type sentri_sessionsUncheckedCreateWithoutSentri_usersInput = {
    id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
  }

  export type sentri_sessionsCreateOrConnectWithoutSentri_usersInput = {
    where: sentri_sessionsWhereUniqueInput
    create: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput>
  }

  export type sentri_sessionsCreateManySentri_usersInputEnvelope = {
    data: sentri_sessionsCreateManySentri_usersInput | sentri_sessionsCreateManySentri_usersInput[]
    skipDuplicates?: boolean
  }

  export type sentri_identifiersUpsertWithWhereUniqueWithoutSentri_usersInput = {
    where: sentri_identifiersWhereUniqueInput
    update: XOR<sentri_identifiersUpdateWithoutSentri_usersInput, sentri_identifiersUncheckedUpdateWithoutSentri_usersInput>
    create: XOR<sentri_identifiersCreateWithoutSentri_usersInput, sentri_identifiersUncheckedCreateWithoutSentri_usersInput>
  }

  export type sentri_identifiersUpdateWithWhereUniqueWithoutSentri_usersInput = {
    where: sentri_identifiersWhereUniqueInput
    data: XOR<sentri_identifiersUpdateWithoutSentri_usersInput, sentri_identifiersUncheckedUpdateWithoutSentri_usersInput>
  }

  export type sentri_identifiersUpdateManyWithWhereWithoutSentri_usersInput = {
    where: sentri_identifiersScalarWhereInput
    data: XOR<sentri_identifiersUpdateManyMutationInput, sentri_identifiersUncheckedUpdateManyWithoutSentri_usersInput>
  }

  export type sentri_identifiersScalarWhereInput = {
    AND?: sentri_identifiersScalarWhereInput | sentri_identifiersScalarWhereInput[]
    OR?: sentri_identifiersScalarWhereInput[]
    NOT?: sentri_identifiersScalarWhereInput | sentri_identifiersScalarWhereInput[]
    id?: StringFilter<"sentri_identifiers"> | string
    user_id?: StringFilter<"sentri_identifiers"> | string
    type?: StringFilter<"sentri_identifiers"> | string
    value?: StringFilter<"sentri_identifiers"> | string
    created_at?: DateTimeFilter<"sentri_identifiers"> | Date | string
  }

  export type sentri_sessionsUpsertWithWhereUniqueWithoutSentri_usersInput = {
    where: sentri_sessionsWhereUniqueInput
    update: XOR<sentri_sessionsUpdateWithoutSentri_usersInput, sentri_sessionsUncheckedUpdateWithoutSentri_usersInput>
    create: XOR<sentri_sessionsCreateWithoutSentri_usersInput, sentri_sessionsUncheckedCreateWithoutSentri_usersInput>
  }

  export type sentri_sessionsUpdateWithWhereUniqueWithoutSentri_usersInput = {
    where: sentri_sessionsWhereUniqueInput
    data: XOR<sentri_sessionsUpdateWithoutSentri_usersInput, sentri_sessionsUncheckedUpdateWithoutSentri_usersInput>
  }

  export type sentri_sessionsUpdateManyWithWhereWithoutSentri_usersInput = {
    where: sentri_sessionsScalarWhereInput
    data: XOR<sentri_sessionsUpdateManyMutationInput, sentri_sessionsUncheckedUpdateManyWithoutSentri_usersInput>
  }

  export type sentri_sessionsScalarWhereInput = {
    AND?: sentri_sessionsScalarWhereInput | sentri_sessionsScalarWhereInput[]
    OR?: sentri_sessionsScalarWhereInput[]
    NOT?: sentri_sessionsScalarWhereInput | sentri_sessionsScalarWhereInput[]
    id?: StringFilter<"sentri_sessions"> | string
    user_id?: StringFilter<"sentri_sessions"> | string
    expires_at?: DateTimeFilter<"sentri_sessions"> | Date | string
    ip_address?: StringNullableFilter<"sentri_sessions"> | string | null
    user_agent?: StringNullableFilter<"sentri_sessions"> | string | null
    replaced_by?: StringNullableFilter<"sentri_sessions"> | string | null
    created_at?: DateTimeFilter<"sentri_sessions"> | Date | string
  }

  export type sentri_identifiersCreateManySentri_usersInput = {
    id: string
    type: string
    value: string
    created_at?: Date | string
  }

  export type sentri_sessionsCreateManySentri_usersInput = {
    id: string
    expires_at: Date | string
    ip_address?: string | null
    user_agent?: string | null
    replaced_by?: string | null
    created_at?: Date | string
  }

  export type sentri_identifiersUpdateWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_identifiersUncheckedUpdateWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_identifiersUncheckedUpdateManyWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsUpdateWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsUncheckedUpdateWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sentri_sessionsUncheckedUpdateManyWithoutSentri_usersInput = {
    id?: StringFieldUpdateOperationsInput | string
    expires_at?: DateTimeFieldUpdateOperationsInput | Date | string
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    replaced_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}