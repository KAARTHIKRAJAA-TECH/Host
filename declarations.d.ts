// Declare missing module typings
declare module 'connect-sqlite3' {
  import * as expressSession from 'express-session';
  
  function connectSqlite3(options: any): any;
  
  namespace connectSqlite3 {
    export interface SqliteStoreOptions {
      dir?: string;
      db?: string;
      table?: string;
      concurrentDB?: boolean;
    }
  }
  
  export = connectSqlite3;
}

// Add session userId property
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}