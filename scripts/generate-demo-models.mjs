// Original illustrative models, in metres. No external textures or decoders.
// These are demo shapes, not scans or specifications of retail products.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { writeFile, mkdir } from 'node:fs/promises';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(data => { this.result = data; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(data => { this.result = `data:application/octet-stream;base64,${Buffer.from(data).toString('base64')}`; this.onloadend?.(); }); }
};
const material = (name, color, metalness = .1, roughness = .45) => new THREE.MeshStandardMaterial({ name, color, metalness, roughness });
const shell = material('shell', '#25354c', .5);
const dark = material('rubber', '#121923', .05, .8);
const keycap = material('keycaps', '#586a85');
const cyan = material('accent', '#20cbe2', .3, .25);
const chrome = material('metal', '#8d9bae', .8, .25);
const glass = material('display', '#12344e', .4, .15);
const geometries = new Map();
function box(group, size, position, mat = shell, rounded = false) {
  const key = JSON.stringify([size, rounded]);
  if (!geometries.has(key)) geometries.set(key, rounded ? new RoundedBoxGeometry(...size, 2, Math.min(...size) * .15) : new THREE.BoxGeometry(...size));
  const mesh = new THREE.Mesh(geometries.get(key), mat);
  mesh.position.set(...position); group.add(mesh); return mesh;
}
function cylinder(group, radius, height, position, mat = chrome) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), mat);
  mesh.position.set(...position); group.add(mesh); return mesh;
}
function keyboard() {
  const g = new THREE.Group();
  box(g, [.33,.024,.135], [0,.016,0], shell, true);
  box(g, [.318,.003,.122], [0,.03,0], dark);
  for (let row=0;row<5;row++) for(let col=0;col<15;col++) {
    if(row===4 && col>2 && col<10) continue;
    box(g,[.017,.009,.017],[-.143+col*.0204,.036,-.048+row*.022],col===0||col===14?cyan:keycap,true);
  }
  box(g,[.14,.009,.017],[-.02,.036,.040],keycap,true);
  box(g,[.305,.002,.003],[0,.018,.068],cyan);
  return g;
}
function phone() {
  const g = new THREE.Group();
  box(g,[.074,.151,.009],[0,.080,0],shell,true);
  box(g,[.068,.143,.001],[0,.080,.005],dark,true);
  box(g,[.063,.129,.001],[0,.080,.0056],glass,true);
  for(let i=0;i<3;i++) box(g,[.052,.003,.0003],[0,.040+i*.017,.0062],i===1?cyan:keycap,true);
  box(g,[.023,.004,.001],[0,.144,.006],dark,true);
  box(g,[.029,.032,.003],[-.018,.131,-.006],chrome,true);
  for(const [x,y] of [[-.023,.138],[-.011,.126],[-.023,.125]]) {
    const lens=cylinder(g,.0048,.004,[x,y,-.009],dark);lens.rotation.x=Math.PI/2;
  }
  return g;
}
function chair() {
  const g = new THREE.Group();
  box(g,[.5,.11,.48],[0,.49,0],dark,true);
  const back=box(g,[.46,.72,.11],[0,.87,-.2],shell,true);back.rotation.x=-.1;
  box(g,[.31,.11,.13],[0,1.16,-.12],dark,true);
  for(const x of [-.2,.2]) box(g,[.045,.58,.025],[x,.87,-.124],cyan,true);
  cylinder(g,.035,.35,[0,.26,0]);
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5;
    const spoke=box(g,[.035,.035,.34],[Math.sin(a)*.14,.075,Math.cos(a)*.14],chrome);spoke.rotation.y=a;
    const wheel=cylinder(g,.04,.05,[Math.sin(a)*.3,.044,Math.cos(a)*.3],dark);wheel.rotation.z=Math.PI/2;
  }
  for(const x of [-.31,.31]) { box(g,[.03,.20,.03],[x,.59,.01],chrome);box(g,[.09,.05,.29],[x,.70,.01],dark,true); }
  return g;
}
function robot() {
  const g = new THREE.Group();
  cylinder(g,.15,.026,[0,.013,0],dark);
  box(g,[.15,.19,.10],[0,.32,0],shell,true);
  box(g,[.10,.085,.085],[0,.466,0],chrome,true);
  box(g,[.076,.019,.006],[0,.475,.046],cyan);
  box(g,[.084,.035,.008],[0,.35,.055],cyan,true);
  for(const x of [-1,1]) {
    box(g,[.057,.14,.075],[x*.052,.147,0],chrome,true);
    box(g,[.066,.037,.117],[x*.052,.05,.024],shell,true);
    box(g,[.066,.115,.08],[x*.115,.34,0],shell,true);
    cylinder(g,.028,.065,[x*.122,.245,0],chrome);
    box(g,[.053,.05,.058],[x*.122,.20,0],dark,true);
  }
  return g;
}
await mkdir(new URL('../public/models/demo/', import.meta.url), { recursive: true });
for(const [name,create] of Object.entries({keyboard,phone,chair,robot})) {
  const scene = create(); scene.name = `SpinShop illustrative ${name}`;
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
  await writeFile(new URL(`../public/models/demo/${name}.glb`, import.meta.url), Buffer.from(glb));
  console.log(`${name}: ${glb.byteLength} bytes`);
}
