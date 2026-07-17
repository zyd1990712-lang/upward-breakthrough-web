const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const assertBundleVersions=parts=>{const ids=parts.map(x=>x._bundle?.build_id);if(ids.some(x=>typeof x!=='string'||!x)||new Set(ids).size!==1)throw new Error('数据包版本不一致，请刷新页面')};
const safeUrl=value=>{try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}};
const flatten=(rows,out=[])=>{for(const row of rows){out.push(row);flatten(row.children||[],out)}return out};
const link=node=>`<a class="node-link" href="detail.html?id=${encodeURIComponent(node.node_id)}"><span class="code">${escapeHtml(node.code)}</span> ${escapeHtml(node.name_zh||node.name_en)}</a>`;
const cardinalityLabel=v=>({'one-to-one':'一对一','one-to-many':'一对多','many-to-one':'多对一','many-to-many':'多对多'}[v]||v);
const card=m=>`<div class="detail-relation"><div><span class="code">${escapeHtml(m.source_code)}</span> ${escapeHtml(m.source_name)}</div><b>→</b><div><span class="code">${escapeHtml(m.target_code)}</span> ${escapeHtml(m.target_name)}</div><small>${escapeHtml(cardinalityLabel(m.cardinality))} · ${escapeHtml(m.relation_label_zh)}</small></div>`;
async function init(){
 const id=new URLSearchParams(location.search).get('id');
 const responses=await Promise.all(['data/core.json','data/trees.json','data/relationships.json'].map(u=>fetch(u)));const failed=responses.find(r=>!r.ok);if(failed)throw new Error(`HTTP ${failed.status}`);const parts=await Promise.all(responses.map(r=>r.json()));assertBundleVersions(parts);const data=Object.assign({},...parts);
 const nodes=Object.values(data.classification_trees).flatMap(roots=>flatten(roots,[]));const byId=new Map(nodes.map(n=>[n.node_id,n]));const node=byId.get(id);
 const sourceLink=document.querySelector('#sourceLink');sourceLink.hidden=true;if(!node){document.querySelector('#nodeTitle').textContent='没有找到该分类节点';document.querySelector('#nodeDefinition').textContent='请返回分类查询，或检查链接中的节点ID。';document.querySelector('.detail-grid').hidden=true;document.querySelector('#sourceLink').hidden=true;return}
 document.title=`${node.code} ${node.name_zh||node.name_en} · 向上突破`;
 document.querySelector('#nodeSystem').textContent=`${node.system_id} · LEVEL ${node.level}`;
 document.querySelector('#nodeTitle').textContent=`${node.code} ${node.name_zh||node.name_en}`;
 document.querySelector('#nodeDefinition').textContent=node.definition||'官方数据未提供单独定义。';
 const parent=byId.get(node.parent_node_id);document.querySelector('#parentLink').innerHTML=parent?link(parent):'顶层分类';
 document.querySelector('#childList').innerHTML=(node.children||[]).map(link).join('')||'暂无下级分类';
 const mappings=data.mappings.filter(m=>m.source_node_id===id||m.target_node_id===id);document.querySelector('#mappingList').innerHTML=mappings.map(card).join('')||'暂无已登记对应关系';
 const explanation=(data.green_explanations||[]).find(x=>x.node_id===id);document.querySelector('#greenExplanation').textContent=explanation?.explanation||'该节点暂无独立解释说明。';document.querySelector('#relatedStandards').textContent=explanation?.related_standards||'未提取到明确标准引用。';
 document.querySelector('#nodeStatus').textContent=`状态：${node.status||'未标注'} · 来源：${node.source_id||'未标注'}`;
 const source=data.sources[node.source_id]||{};const url=safeUrl(source.official_url);if(url){sourceLink.href=url;sourceLink.hidden=false}
}
init().catch(e=>{document.querySelector('#nodeTitle').textContent='数据加载失败';document.querySelector('#nodeDefinition').textContent=e.message;console.error(e)});