const {test}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
test('application source files are valid UTF-8 for Turbopack',()=>{
 const decoder=new TextDecoder('utf-8',{fatal:true});
 function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())scan(file);
  else if(/\.(tsx?|css)$/.test(file)){
   try{decoder.decode(fs.readFileSync(file));}catch{throw new Error(file+' must be saved as UTF-8');}
  }
 }}
 scan('src');
});
