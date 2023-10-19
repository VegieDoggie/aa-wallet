import 'mocha';
import { assert } from 'chai';
import { helloWorld } from '../src';
import npmPackage from '../src/index';

describe('NPM Package', () => {
  it('should have `helloWorld`', () => {
    assert.property(npmPackage, 'helloWorld');
  });
});

describe('Hello World Function', () => {
  it('should return `Hello World!`', () => {
    assert.equal(helloWorld(), 'Hello World!');
  });
});
