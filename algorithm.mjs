/**
 * Pure Tarjan traversal with immutable playback snapshots. Node identifiers are zero-based internally and shown as one-based labels in messages.
 */
/**
 * Run Tarjan's depth-first search and retain independent snapshots for forward/backward playback.
 *
 * @param count - Number of nodes in the directed graph, labeled internally from zero.
 * @param edges - Directed edges represented as pairs of zero-based node identifiers.
 * @returns Ordered playback snapshots containing indices, low-links, stack contents, and completed components.
 */
export function tarjanTrace(count,edges) {
    const adjacency=Array.from({length:count},()=>[]);
    for(const [a,b] of edges) adjacency[a].push(b);
    const indices=new Array(count).fill(-1),low=new Array(count).fill(-1),onStack=new Set(),stack=[],components=[],frames=[];
    let index=0;
    /**
     * Save independent copies of traversal state so playback cannot mutate earlier steps.
     *
     * @param message - Human-readable explanation saved with this traversal step.
     * @param current - Highlighted node identifier for this snapshot, or null when no node is active. Default: null.
     * @param edge - Directed edge currently highlighted, or null when no edge is active. Default: null.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    function record(message,current=null,edge=null) {
        frames.push({message,current,edge,indices:[...indices],low:[...low],stack:[...stack],components:components.map(c=>[...c])});
    }
    /**
     * Visit one graph node, propagate low-link values, and pop a component when its root completes.
     *
     * @param v - Zero-based graph node visited by the depth-first search.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    function visit(v) {
        indices[v]=low[v]=index++;stack.push(v);onStack.add(v);record(`Visit ${v+1}: index and low-link are ${indices[v]}. Push it onto the stack.`,v);
        for(const w of adjacency[v]) {
            record(`Explore directed edge ${v+1} → ${w+1}.`,v,[v,w]);
            if(indices[w]===-1) {
                visit(w);low[v]=Math.min(low[v],low[w]);record(`Return to ${v+1}: update its low-link to ${low[v]}.`,v);
            } else if(onStack.has(w)) {
                low[v]=Math.min(low[v],indices[w]);record(`${w+1} is on the stack: update ${v+1}'s low-link to ${low[v]}.`,v,[v,w]);
            }
        }
        if(low[v]===indices[v]) {
            const component=[];let w;
            do {w=stack.pop();onStack.delete(w);component.push(w);} while(w!==v);
            components.push(component);record(`Component found: ${component.map(n=>n+1).join(', ')}. These nodes can all reach one another.`,v);
        }
    }
    record('Ready. Start a depth-first search to discover strongly connected components.');
    for(let v=0;v<count;v++) if(indices[v]===-1) visit(v);
    record(`Complete: ${components.length} strongly connected component${components.length===1?'':'s'} found.`);
    return frames;
}
