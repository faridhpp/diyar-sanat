import { sql, type SQL } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';
import * as schema from './schema';
import type { Database } from './database.types';
import { withAccess, type Access } from './connection';

type Tables = Database['public']['Tables'];
type Name = keyof Tables;
type Row<N extends Name> = Tables[N]['Row'];
type Result<T> = {data:T|null; error:{message:string;code?:string}|null; count:number|null};
// A small server-only repository facade preserves the existing call sites while
// every operation runs parameterized Drizzle SQL inside a role-scoped transaction.
export class Query<N extends Name, Single extends boolean = false> implements PromiseLike<Result<Single extends true ? Row<N> : Row<N>[]>> {
  private fields = '*';
  private filters:SQL[] = [];
  private ordering:SQL[] = [];
  private size?:number;
  private operation:'select'|'insert'|'update'|'delete'|'upsert' = 'select';
  private values:Record<string,unknown>[] = [];
  private conflict = 'id';
  private one = false;
  private required = false;
  private head = false;
  private counted = false;
  private returning = false;
  constructor(private table:N, private access:Access) {}
  private column(name:string) {
    // Validate identifiers against the real Drizzle schema; no arbitrary SQL.
    const table = schema[this.table];
    if (!(name in getTableColumns(table))) throw new Error(`Unknown column: ${this.table}.${name}`);
    return sql.identifier(name);
  }
  select(fields='*',options?:{count?:'exact';head?:boolean}) { this.fields=fields;this.counted=options?.count==='exact';this.head=Boolean(options?.head);this.returning=true;return this; }
  eq(column:string,value:unknown) {this.filters.push(sql`${this.column(column)} = ${value}`);return this;}
  lte(column:string,value:unknown) {this.filters.push(sql`${this.column(column)} <= ${value}`);return this;}
  is(column:string,value:null|boolean) {this.filters.push(value===null?sql`${this.column(column)} is null`:sql`${this.column(column)} = ${value}`);return this;}
  in(column:string,values:readonly unknown[]) {this.filters.push(values.length?sql`${this.column(column)} in (${sql.join(values.map(v=>sql`${v}`),sql`, `)})`:sql`false`);return this;}
  or(expression:string) {
    const conditions=expression.split(',').map(part=>{const match=/^([a-z_]+)\.ilike\.(.*)$/.exec(part);if(!match)throw new Error('Unsupported filter');return sql`${this.column(match[1])} ilike ${match[2]}`;});
    this.filters.push(sql`(${sql.join(conditions,sql` or `)})`);return this;
  }
  order(column:string,options?:{ascending?:boolean}) {this.ordering.push(sql`${this.column(column)} ${options?.ascending===false?sql`desc`:sql`asc`}`);return this;}
  limit(value:number) {if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid limit');this.size=value;return this;}
  insert(value:Tables[N]['Insert']|Tables[N]['Insert'][]) {this.operation='insert';this.values=(Array.isArray(value)?value:[value]) as Record<string,unknown>[];return this;}
  update(value:Tables[N]['Update']) {this.operation='update';this.values=[value as Record<string,unknown>];return this;}
  delete() {this.operation='delete';return this;}
  upsert(value:Tables[N]['Insert']|Tables[N]['Insert'][],options?:{onConflict:string}) {this.insert(value);this.operation='upsert';this.conflict=options?.onConflict??'id';return this;}
  single() {this.one=true;this.required=true;return this as unknown as Query<N,true>;}
  maybeSingle() {this.one=true;return this as unknown as Query<N,true>;}
  private async execute():Promise<Result<Single extends true ? Row<N> : Row<N>[]>> {
    type Data = Single extends true ? Row<N> : Row<N>[];
    try {
      const projection=this.fields==='*'?sql`*`:sql.join(this.fields.split(',').map(s=>this.column(s.trim())),sql`, `);
      const table=sql`${sql.identifier('public')}.${sql.identifier(this.table)}`;
      const where=this.filters.length?sql` where ${sql.join(this.filters,sql` and `)}`:sql``;
      let query:SQL;
      if(this.operation==='select') {
        query=sql`select ${this.head?sql`count(*)::integer as count`:projection} from ${table}${where}`;
        if(!this.head&&this.ordering.length)query.append(sql` order by ${sql.join(this.ordering,sql`, `)}`);
        if(!this.head&&this.size!==undefined)query.append(sql` limit ${this.size}`);
      } else if(this.operation==='delete') {
        if(!this.filters.length)throw new Error('Unfiltered delete rejected');
        query=sql`delete from ${table}${where}`;
      } else {
        const columns=[...new Set(this.values.flatMap(row=>Object.keys(row).filter(key=>row[key]!==undefined)))];
        if(!columns.length)return {data:[] as unknown as Data,error:null,count:null};
        const parameter=(value:unknown)=>sql`${sql.param(value!==null&&typeof value==='object'&&!Array.isArray(value)?JSON.stringify(value):value)}`;
        if(this.operation==='update') {
          if(!this.filters.length)throw new Error('Unfiltered update rejected');
          query=sql`update ${table} set ${sql.join(columns.map(c=>sql`${this.column(c)} = ${parameter(this.values[0][c])}`),sql`, `)}${where}`;
        } else {
          query=sql`insert into ${table} (${sql.join(columns.map(c=>this.column(c)),sql`, `)}) values ${sql.join(this.values.map(row=>sql`(${sql.join(columns.map(c=>row[c]===undefined?sql`default`:parameter(row[c])),sql`, `)})`),sql`, `)}`;
          if(this.operation==='upsert') {
            const keys=this.conflict.split(',').map(s=>s.trim());
            const updates=columns.filter(c=>!keys.includes(c));
            query.append(sql` on conflict (${sql.join(keys.map(c=>this.column(c)),sql`, `)}) ${updates.length?sql`do update set ${sql.join(updates.map(c=>sql`${this.column(c)} = excluded.${this.column(c)}`),sql`, `)}`:sql`do nothing`}`);
          }
        }
      }
      if(this.operation!=='select'&&this.returning)query.append(sql` returning ${projection}`);
      const result=await withAccess(this.access,db=>db.execute(query));
      if(this.one&&(result.rows.length>1||(this.required&&result.rows.length!==1)))throw new Error('Expected one record');
      return {data:(this.head?null:this.one?(result.rows[0]??null):result.rows) as Data,count:this.head?Number(result.rows[0].count):this.counted?result.rows.length:null,error:null};
    }catch(error){
      const cause=error instanceof Error&&error.cause?error.cause:error;
      const code=typeof cause==='object'&&cause&&'code' in cause?String(cause.code):undefined;
      // Never return parameterized SQL, passwords, or submission data to callers.
      console.error('Database operation failed', {table:this.table,operation:this.operation,code});
      return {data:null,error:{message:'Database operation failed',code},count:null};
    }
  }
  then<TResult1=Result<Single extends true ? Row<N> : Row<N>[]>, TResult2=never>(onfulfilled?:((value:Result<Single extends true ? Row<N> : Row<N>[]>)=>TResult1|PromiseLike<TResult1>)|null,onrejected?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2> {return this.execute().then(onfulfilled,onrejected);}
}
export const repository=(access:Access)=>({from:<N extends Name>(table:N)=>new Query(table,access)});
