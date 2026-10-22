/**
 * Tarjan strongly connected components demo. A depth-first search records index, low-link, stack, and completed components for playback.
 */
import {tarjanTrace} from './algorithm.mjs';
const svg=document.getElementById('graph'),play=document.getElementById('play');
const ns='http://www.w3.org/2000/svg',palette=['#ac8bea','#65a9ed','#e9aa64','#72ddd0','#8bc56b','#e782a6'];
let nodes=9,edges=[],frames=[],position=0,playing=false,last=0,edgeElements=[],nodeElements=[];
/**
 * Create an SVG element with attributes and optional safe text content.
 *
 * @param tag - SVG element tag to create.
 * @param attributes - Attribute names and values to apply to the SVG element. Default: {}.
 * @param text - Text to parse or display.
 * @returns New SVG element with its attributes and optional text content.
 */
function element(tag,attributes={},text) {const e=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attributes))e.setAttribute(key,value);if(text!==undefined)e.textContent=text;return e;}
/**
 * Pause simulation playback and restore the controls without discarding the current state.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function stop(){playing=false;play.textContent='Play';}
/**
 * Reset playback, record the traversal, and construct the directed graph with arrowheads.
 *
 * @param count - Number of nodes in the directed graph, labeled internally from zero.
 * @param links - Directed graph edges as pairs of zero-based node identifiers.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function load(count,links) {
    stop();nodes=count;edges=links;position=0;frames=tarjanTrace(nodes,edges);
    svg.replaceChildren(element('title',{id:'graph-title'},`Directed graph with ${nodes} nodes and ${edges.length} edges`));
    const defs=element('defs');
    for(const [id,color] of [['arrow','var(--site-muted)'],['active-arrow','#ffdf7c']]) {
        const marker=element('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});marker.appendChild(element('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.appendChild(marker);
    }
    svg.appendChild(defs);
    const locations=Array.from({length:nodes},(_,i)=>({x:400+260*Math.cos(i/nodes*Math.PI*2-Math.PI/2),y:325+260*Math.sin(i/nodes*Math.PI*2-Math.PI/2)}));
    edgeElements=edges.map(([from,to])=>{
        const a=locations[from],b=locations[to],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
        const reverse=edges.some(([x,y])=>x===to&&y===from);
        const bend=reverse?24:0,cx=(a.x+b.x)/2-uy*bend,cy=(a.y+b.y)/2+ux*bend;
        const startLength=Math.hypot(cx-a.x,cy-a.y),endLength=Math.hypot(b.x-cx,b.y-cy);
        const path=element('path',{class:'edge',d:`M ${a.x+(cx-a.x)/startLength*24} ${a.y+(cy-a.y)/startLength*24} Q ${cx} ${cy} ${b.x-(b.x-cx)/endLength*28} ${b.y-(b.y-cy)/endLength*28}`,'marker-end':'url(#arrow)'});
        path.appendChild(element('title',{},`${from+1} → ${to+1}`));svg.appendChild(path);return path;
    });
    nodeElements=locations.map((p,i)=>{
        const group=element('g',{class:'node'});group.append(element('circle',{cx:p.x,cy:p.y,r:23,fill:'var(--site-raised)'}),element('text',{x:p.x,y:p.y},i+1));svg.appendChild(group);return group;
    });
    draw();
}
/**
 * Apply one trace snapshot to node colors, active edges, stack, component list, and table.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function draw() {
    const frame=frames[position];
    document.getElementById('trace-message').textContent=frame.message;
    document.getElementById('step-count').textContent=`Step ${position} / ${frames.length-1}`;
    document.getElementById('stack').textContent=frame.stack.length?frame.stack.map(n=>n+1).join(' → ')+' (top)':'Empty';
    const list=document.getElementById('components');list.replaceChildren();
    frame.components.forEach((component,i)=>{
        const li=document.createElement('li'),swatch=document.createElement('span');swatch.className='component-swatch';swatch.style.background=palette[i%palette.length];li.append(swatch,document.createTextNode(`Component ${i+1}: ${component.map(n=>n+1).join(', ')}`));list.appendChild(li);
    });
    nodeElements.forEach((group,id)=>{
        const component=frame.components.findIndex(c=>c.includes(id));
        group.setAttribute('class',`node${frame.current===id?' current':''}`);
        group.firstChild.setAttribute('fill',component>=0?palette[component%palette.length]:'var(--site-raised)');
    });
    edgeElements.forEach((path,i)=>{const active=frame.edge&&frame.edge[0]===edges[i][0]&&frame.edge[1]===edges[i][1];path.setAttribute('class',active?'edge active':'edge');path.setAttribute('marker-end',active?'url(#active-arrow)':'url(#arrow)');});
    const table=document.getElementById('node-table');table.replaceChildren();
    for(let i=0;i<nodes;i++) {const row=document.createElement('tr');for(const value of [i+1,frame.indices[i]<0?'—':frame.indices[i],frame.low[i]<0?'—':frame.low[i],frame.stack.includes(i)?'Yes':'No']){const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);}table.appendChild(row);}
    document.getElementById('previous').disabled=position===0;document.getElementById('next').disabled=position===frames.length-1;
    if(position===frames.length-1)stop();
}
for(const id of ['node-count','edge-density','speed'])document.getElementById(id).addEventListener('input',event=>{document.getElementById(`${id}-value`).value=event.target.value+(id==='edge-density'?'%':'');});
play.addEventListener('click',()=>{if(playing){stop();return;}if(position===frames.length-1)position=0;playing=true;play.textContent='Pause';last=performance.now();draw();});
document.getElementById('next').addEventListener('click',()=>{stop();position=Math.min(position+1,frames.length-1);draw();});
document.getElementById('previous').addEventListener('click',()=>{stop();position=Math.max(0,position-1);draw();});
document.getElementById('reset').addEventListener('click',()=>{stop();position=0;draw();});
document.getElementById('finish').addEventListener('click',()=>{stop();position=frames.length-1;draw();});
/**
 * Load a directed graph with several cycles connected in one direction.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function example(){load(9,[[0,1],[1,2],[2,0],[2,3],[3,4],[4,5],[5,3],[5,6],[6,7],[7,6],[7,8]]);}
document.getElementById('example').addEventListener('click',example);
document.getElementById('graph-form').addEventListener('submit',event=>{
    event.preventDefault();const count=Number(document.getElementById('node-count').value),probability=Number(document.getElementById('edge-density').value)/100,links=[];
    for(let a=0;a<count;a++)for(let b=0;b<count;b++)if(a!==b&&Math.random()<probability)links.push([a,b]);load(count,links);
});
/**
 * Advance time-dependent simulation work and redraw the view on the next animation frame.
 *
 * @param time - Animation-frame timestamp in milliseconds.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function animate(time){if(playing&&time-last>=1000/Number(document.getElementById('speed').value)){last=time;position=Math.min(position+1,frames.length-1);draw();}requestAnimationFrame(animate);}
example();requestAnimationFrame(animate);
