import {test} from 'node:test';import assert from 'node:assert/strict';
import {mergeSavedLikes} from '../src/services/problemLikeState.js';
test('an older list cannot overwrite a newly saved like or unlike',()=>{
 const rows=[{id:7,liked_by_me:false,count:0},{id:8,liked_by_me:true,count:5}];
 const updates=new Map([['7',{userId:'alice',revision:2,liked_by_me:true,likes_count:1}],['8',{userId:'alice',revision:3,liked_by_me:false,likes_count:4}]]);
 const merged=mergeSavedLikes(rows,updates,1,'alice');
 assert.equal(merged[0].liked_by_me,true);assert.equal(merged[0].count,1);
 assert.equal(merged[1].liked_by_me,false);assert.equal(merged[1].count,4);
 assert.deepEqual(mergeSavedLikes(rows,updates,3,'alice'),rows);
 assert.deepEqual(mergeSavedLikes(rows,updates,1,'bob'),rows);
 assert.equal(rows[0].count,0);
});
