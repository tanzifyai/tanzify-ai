// simple base64url payload decoder
const t = process.argv[2];
if(!t){
  console.error('No token provided');
  process.exit(1);
}
const parts = t.split('.');
if(parts.length < 2){
  console.error('Not a JWT');
  process.exit(2);
}
const payload = parts[1];
function base64urlDecode(s){
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}
try{
  console.log(base64urlDecode(payload));
}catch(e){
  console.error('Decode error', e.message);
  process.exit(3);
}
