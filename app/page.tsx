import {configuredIds} from '../lib/source.mjs';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default function Page(){return <Dashboard ids={configuredIds()} stored={!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.ZENSHIN_SEASON)}/>}
