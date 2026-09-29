const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const moduleUnderTest={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/pessoas/ponto-time.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:moduleUnderTest.exports,module:moduleUnderTest});
const {pontoMinutes}=moduleUnderTest.exports;
test('signed duration applies sign to minutes as well as hours',()=>{
 assert.equal(pontoMinutes('-01:30'),-90);
 assert.equal(pontoMinutes('-00:30'),-30);
 assert.equal(pontoMinutes('-120:15:00'),-7215);
 assert.equal(pontoMinutes('123:45'),7425);
});
test('zero hours and invalid values do not create false alerts',()=>{
 for(const value of ['000:00','00:00:00','','inválido','1:99']) assert.equal(pontoMinutes(value),0);
 assert.equal(pontoMinutes('00:30:00'),30);
});
