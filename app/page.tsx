import {configuredIds} from '../lib/source.mjs';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default function Page(){return <Dashboard ids={configuredIds()}/>}
