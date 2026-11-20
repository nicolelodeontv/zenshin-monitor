export type Member = {name:string;level:number;rep:number};
export type Snapshot = {name:string;reputation:number;members:Member[];memberTotal:number;consistent:boolean;clanId:string;observedAt:string};
export function configuredIds(value?:string):string[];
export function validate(data:unknown):Omit<Snapshot,'clanId'|'observedAt'>;
export function readClan(id:string):Promise<Snapshot>;
