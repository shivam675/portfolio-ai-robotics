import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { profile } from '../src/data/profile.js';

test('featured projects have unique anchors, verified source links, and local media',()=>{
  const ids=profile.projects.map(project=>project.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const project of profile.projects){
    const url=new URL(project.repository);
    assert.equal(url.hostname,'github.com');
    assert.ok(url.pathname.startsWith('/shivam675/'));
    assert.ok(statSync(`public${project.image}`).size>1000);
    if(project.animation) assert.ok(statSync(`public${project.animation}`).size>1000);
  }
  assert.ok(statSync('public/shivam-chavan-resume.pdf').size>1000);
});
