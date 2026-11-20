import {test} from 'node:test';import assert from 'node:assert/strict';import {validate,configuredIds} from '../lib/source.mjs';
test('validates Unicode and ranks members',()=>{const x=validate({name:'Test',reputation:5,members:[{name:'暁',level:100,rep:2},{name:'β',level:80,rep:3}]});assert.equal(x.members[0].name,'β');assert.equal(x.consistent,true)});
test('rejects empty or duplicate roster',()=>{assert.throws(()=>validate({name:'Test',reputation:0,members:[]}));const m={name:'a',level:1,rep:0};assert.throws(()=>validate({name:'Test',reputation:0,members:[m,m]}))});
test('flags mismatch',()=>assert.equal(validate({name:'Test',reputation:4,members:[{name:'a',level:1,rep:2}]}).consistent,false));
test('allowlist only numeric IDs',()=>assert.deepEqual(configuredIds('3,3,../foo,9'),['3','9']));
