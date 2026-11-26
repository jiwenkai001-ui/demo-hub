/* 花名册洞察官 - 前端统计与看板渲染（全部本地完成） */
(function () {
  "use strict";

  var PALETTE = ["#5B8DEF","#36CFC9","#F7B955","#F27166","#9B7BF0","#63C28C","#EC87C0","#7E93A8","#4FC1E9","#A0AEC0"];
  var GENDER_COLOR = { "男":"#5B8DEF", "女":"#EC87C0" };
  var STATUS_COLOR = { "正式":"#36CFC9", "试用":"#F7B955" };
  var EDU_COLOR = { "统招本科":"#5B8DEF","统招大专":"#9B7BF0","本科":"#5B8DEF","大专":"#9B7BF0","硕士":"#36CFC9","研究生":"#36CFC9","博士":"#63C28C" };
  var MARRY_COLOR = { "已婚":"#36CFC9", "未婚":"#F7B955" };

  // 字段别名映射：标准名 -> 候选字段
  var ALIASES = {
    姓名:["姓名","名字","员工姓名","name"],
    状态:["状态","在职状态","员工状态","雇佣状态"],
    性别:["性别","gender","sex"],
    年龄:["年龄","age"],
    学历:["最高学历","学历","文化程度"],
    部门:["三级组织口","部门","所属部门","组织","organizations"],
    岗位职务:["岗位职务","岗位","职务","职位","position"],
    行政职级:["行政职级","职级","级别"],
    序列:["序列","岗位序列","职族"],
    司龄:["司龄","在本公司工龄"],
    工龄:["工龄"],
    入职日期:["入职日期","入职时间","入职日"],
    婚姻状况:["婚姻状况","婚否","婚姻"],
    籍贯:["籍贯","户籍","老家"],
    毕业学校:["全日制毕业学校","毕业学校","学校"],
    负责人:["是否为组织口负责人","是否负责人","负责人"],
    上级主管:["上级主管","直属上级","主管","汇报对象"],
    转正日期:["实际转正日期","转正日期"]
  };

  var currentData = null;   // 标准化后的记录数组
  var currentStats = null;

  // ---------- utils ----------
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  function clean(v){ if(v==null) return "未填写"; var s=String(v).trim(); return s||"未填写"; }
  function getField(rec, std){
    var al = ALIASES[std] || [std];
    for(var i=0;i<al.length;i++){ var k=al[i]; if(rec[k]!=null && String(rec[k]).trim()!=="") return rec[k]; }
    return null;
  }
  function counter(field){
    var m={};
    currentData.forEach(function(r){ var k=clean(getField(r,field)); m[k]=(m[k]||0)+1; });
    return m;
  }
  function sortDesc(obj){
    return Object.keys(obj).map(function(k){return [k,obj[k]];}).sort(function(a,b){return b[1]-a[1];});
  }
  function yearsOf(s){ var m=String(s||"").match(/(\d+)年/); return m?parseInt(m[1],10):0; }
  var PROVINCES=["陕西","山西","河北","河南","山东","安徽","江苏","浙江","四川","广东","湖南","湖北","北京","上海","天津","重庆","甘肃","新疆","宁夏","青海","内蒙古","辽宁","吉林","黑龙江","福建","江西","广西","云南","贵州","海南","西藏"];
  function provinceOf(s){ var x=clean(s); for(var i=0;i<PROVINCES.length;i++){ if(x.indexOf(PROVINCES[i])>=0) return PROVINCES[i]; } return x; }
  function ageBand(a){ if(a<25)return "25岁以下"; if(a<=30)return "25-30岁"; if(a<=35)return "31-35岁"; if(a<=40)return "36-40岁"; return "40岁以上"; }
  function pickColor(colors,label,i){ if(colors && typeof colors==="object" && !Array.isArray(colors)) return colors[label]||PALETTE[i%PALETTE.length]; if(Array.isArray(colors)&&i<colors.length) return colors[i]; return PALETTE[i%PALETTE.length]; }

  // ---------- stats ----------
  function computeStats(){
    var d=currentData, n=d.length;
    var status=counter("状态"), gender=counter("性别"), edu=counter("学历"),
        level=counter("行政职级"), dept=counter("部门"), seq=counter("序列"),
        marry=counter("婚姻状况"), leader=counter("负责人"), manager=counter("上级主管");
    var ages=[], tenure=[];
    var joinYear={}, ageBands={}, prov={};
    d.forEach(function(r){
      var a=clean(getField(r,"年龄"));
      if(/^\d+$/.test(a)){ var ai=parseInt(a,10); ages.push(ai); var b=ageBand(ai); ageBands[b]=(ageBands[b]||0)+1; }
      tenure.push(yearsOf(getField(r,"司龄")));
      var jy=clean(getField(r,"入职日期")).slice(0,4); joinYear[jy]=(joinYear[jy]||0)+1;
      var p=provinceOf(getField(r,"籍贯")); prov[p]=(prov[p]||0)+1;
    });
    var bachelor=0;
    Object.keys(edu).forEach(function(k){ if(/本科|硕士|研究生|博士/.test(k)) bachelor+=edu[k]; });
    var agePeak="—", agePeakN=0;
    var abSorted=sortDesc(ageBands); if(abSorted.length){ agePeak=abSorted[0][0]; agePeakN=abSorted[0][1]; }
    var avg=function(arr){ return arr.length?Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length*10)/10:0; };
    var kpi={
      total:n,
      formal:status["正式"]||0, probation:status["试用"]||0,
      avg_age:avg(ages), avg_tenure:avg(tenure),
      male:gender["男"]||0, female:gender["女"]||0,
      leaders:Object.keys(leader).reduce(function(s,k){ return s+(k==="是"?leader[k]:0); },0),
      dept_count:Object.keys(dept).length, bachelor_plus:bachelor,
      age_peak:agePeak, age_peak_count:agePeakN,
      confirm_filled:d.filter(function(r){return clean(getField(r,"转正日期"))!=="未填写";}).length,
      marry_rate:n?Math.round((marry["已婚"]||0)/n*100):0
    };
    return {
      kpi:kpi, status:status, gender:gender, education:edu, level:level, department:dept,
      sequence:seq, marriage:marry, age_bands:ageBands, join_year:joinYear, province:prov, manager:manager
    };
  }

  // ---------- chart builders ----------
  function donut(data, colors, centerTop, centerSub){
    var total=data.reduce(function(s,x){return s+x[1];},0), size=160, th=22, r=(size-th)/2, c=2*Math.PI*r, cx=size/2;
    var h='<svg viewBox="0 0 '+size+' '+size+'" class="donut-svg">';
    h+='<circle cx="'+cx+'" cy="'+cx+'" r="'+r+'" fill="none" stroke="#EDF1F7" stroke-width="'+th+'"/>';
    var off=0;
    data.forEach(function(item,i){
      var label=item[0], value=item[1];
      if(!total||!value) return;
      var seg=c*value/total, color=pickColor(colors,label,i), dash=data.length>1?Math.max(seg-3,0):seg;
      h+='<circle cx="'+cx+'" cy="'+cx+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+th+'" stroke-linecap="round" stroke-dasharray="'+dash.toFixed(2)+' '+(c-dash).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cx+')"><title>'+esc(label)+': '+value+' ('+Math.floor(value*100/total)+'%)</title></circle>';
      off+=seg;
    });
    h+='<text x="'+cx+'" y="'+(cx-6)+'" text-anchor="middle" class="donut-center-top">'+esc(centerTop)+'</text>';
    h+='<text x="'+cx+'" y="'+(cx+16)+'" text-anchor="middle" class="donut-center-sub">'+esc(centerSub)+'</text>';
    return h+'</svg>';
  }
  function legend(data, colors){
    var total=data.reduce(function(s,x){return s+x[1];},0)||1, h="";
    data.forEach(function(item,i){
      var c=pickColor(colors,item[0],i);
      h+='<div class="lg-item"><span class="lg-dot" style="background:'+c+'"></span><span class="lg-label">'+esc(item[0])+'</span><span class="lg-value">'+item[1]+'</span><span class="lg-pct">'+Math.floor(item[1]*100/total)+'%</span></div>';
    });
    return h;
  }
  function vbars(data, colors){
    var max=Math.max.apply(null,data.map(function(x){return x[1];}).concat([1])), h="";
    data.forEach(function(item,i){
      var pct=item[1]/max*100, c=pickColor(colors,item[0],i);
      h+='<div class="vb-col"><div class="vb-bar-wrap"><div class="vb-value">'+item[1]+'</div><div class="vb-bar" style="height:'+pct.toFixed(1)+'%;background:'+c+'"></div></div><div class="vb-label">'+esc(item[0])+'</div></div>';
    });
    return '<div class="vb">'+h+'</div>';
  }
  function hbars(data, colors){
    var max=Math.max.apply(null,data.map(function(x){return x[1];}).concat([1])), h="";
    data.forEach(function(item,i){
      var w=item[1]/max*100, c=pickColor(colors,item[0],i);
      h+='<div class="hb-row"><div class="hb-label" title="'+esc(item[0])+'">'+esc(item[0])+'</div><div class="hb-track"><div class="hb-fill" style="width:'+w.toFixed(1)+'%;background:'+c+'"></div></div><div class="hb-value">'+item[1]+'</div></div>';
    });
    return h;
  }
  function card(id, title, hint, body){
    document.getElementById(id).innerHTML='<h3>'+esc(title)+'</h3><p class="hint">'+esc(hint)+'</p>'+body;
  }
  function donutCard(id,title,hint,data,colors,ct,cs){
    card(id,title,hint,'<div class="donut-row"><div class="chart">'+donut(data,colors,ct,cs)+'</div><div class="legend">'+legend(data,colors)+'</div></div>');
  }

  // ---------- render dashboard ----------
  function renderDashboard(){
    var s=currentStats, k=s.kpi, total=k.total||1;
    document.getElementById("dashMeta").textContent="共 "+k.total+" 人 · 覆盖 "+k.dept_count+" 个部门 · 数据在本地浏览器统计";

    // KPI
    var kpis=[
      ["#5B8DEF","#EBF2FF","👥","在职总人数",k.total,"人","覆盖 "+k.dept_count+" 个部门"],
      ["#36CFC9","#E6FAF7","✅","正式员工",k.formal,"人","占比 "+Math.floor(k.formal*100/total)+"%"],
      ["#F7B955","#FFF6E5","🆕","试用期员工",k.probation,"人","占比 "+Math.floor(k.probation*100/total)+"%"],
      ["#9B7BF0","#F1ECFF","🎂","平均年龄",k.avg_age,"岁",k.age_peak+"为主力"],
      ["#F27166","#FFEDEB","📅","平均司龄",k.avg_tenure,"年","团队稳定性参考"],
      ["#5B8DEF","#EBF2FF","♂️","男性 / 女性",k.male+" : "+k.female,"","性别比例"],
      ["#36CFC9","#E6FAF7","🎓","本科及以上",k.bachelor_plus,"人","占比 "+Math.floor(k.bachelor_plus*100/total)+"%"],
      ["#9B7BF0","#F1ECFF","⭐","组织口负责人",k.leaders,"人","占比 "+Math.floor(k.leaders*100/total)+"%"],
      ["#F7B955","#FFF6E5","🏢","部门数量",k.dept_count,"个","人员分布广度"],
      ["#F27166","#FFEDEB","📋","已转正人数",k.confirm_filled,"人","已婚率 "+k.marry_rate+"%"]
    ];
    var kh=kpis.map(function(x){
      return '<div class="kpi" style="--c:'+x[0]+';--cbg:'+x[1]+'"><div class="ico">'+x[2]+'</div><div class="label">'+x[3]+'</div><div class="num">'+x[4]+(x[5]?'<small>'+x[5]+'</small>':'')+'</div><div class="foot">'+esc(x[6])+'</div></div>';
    }).join("");
    document.getElementById("kpiGrid").innerHTML=kh;

    donutCard("cardGender","性别构成","全员性别比例",sortDesc(s.gender),GENDER_COLOR,k.total,"总人数");
    donutCard("cardStatus","雇佣状态","正式 / 试用分布",sortDesc(s.status),STATUS_COLOR,k.formal,"正式员工");
    donutCard("cardEdu","学历结构","最高学历分布",sortDesc(s.education),EDU_COLOR,k.bachelor_plus,"本科及以上");

    var deptData=sortDesc(s.department);
    card("cardDept","部门人数分布","各部门在职人数",hbars(deptData,PALETTE));
    var ageOrder=["25岁以下","25-30岁","31-35岁","36-40岁","40岁以上"];
    var ageData=ageOrder.filter(function(x){return s.age_bands[x]!=null;}).map(function(x){return [x,s.age_bands[x]];});
    card("cardAge","年龄段分布",k.age_peak+"为核心主力（"+k.age_peak_count+"人）",vbars(ageData,["#7E93A8","#5B8DEF","#36CFC9","#F7B955","#F27166"]));

    card("cardLevel","行政职级分布","各职级人数",hbars(sortDesc(s.level),PALETTE));
    var yearData=Object.keys(s.join_year).sort().map(function(x){return [x,s.join_year[x]];});
    card("cardYear","入职年份趋势","按入职年份统计人数",vbars(yearData,["#A0AEC0","#7E93A8","#5B8DEF","#36CFC9","#9B7BF0","#F27166"]));

    donutCard("cardSeq","岗位序列","序列类别分布",sortDesc(s.sequence),null,String(Object.keys(s.sequence).length),"类序列");
    donutCard("cardMarry","婚姻状况","全员婚育情况",sortDesc(s.marriage),MARRY_COLOR,k.marry_rate+"%","已婚率");
    var provData=sortDesc(s.province);
    donutCard("cardProv","籍贯分布","按省份统计",provData,PALETTE,provData.length?provData[0][1]:0,provData.length?provData[0][0]:"—");

    card("cardManager","直属上级带教人数","按上级主管统计下属人数（前 6 位）",hbars(sortDesc(s.manager).slice(0,6),PALETTE));

    var topDepts=deptData.slice(0,2).map(function(x){return x[0];}).join("、")||"—";
    var provTop=provData.length?provData[0][0]:"—", provTopN=provData.length?provData[0][1]:0;
    var insights=[
      "团队规模 <b>"+k.total+" 人</b>，正式 <b>"+k.formal+" 人</b>、试用 <b>"+k.probation+" 人</b>。",
      "年龄集中在 <b>"+esc(k.age_peak)+"（"+k.age_peak_count+" 人）</b>，平均 <b>"+k.avg_age+" 岁</b>。",
      "<b>"+esc(topDepts)+"</b>人数最多，共覆盖 <b>"+k.dept_count+" 个部门</b>。",
      "平均司龄 <b>"+k.avg_tenure+" 年</b>，稳定性可参考入职年份分布。",
      "本科及以上 <b>"+k.bachelor_plus+" 人（"+Math.floor(k.bachelor_plus*100/total)+"%）</b>；男女比 <b>"+k.male+":"+k.female+"</b>。",
      "籍贯以 <b>"+esc(provTop)+" "+provTopN+" 人</b>为主，已婚率 <b>"+k.marry_rate+"%</b>。"
    ];
    var ih=insights.map(function(t,i){return '<div class="insight"><div class="n">'+(i+1)+'</div><p>'+t+'</p></div>';}).join("");
    card("cardInsight","关键洞察","基于花名册数据的自动解读",'<div class="insights">'+ih+'</div>');

    renderTable("");
    document.getElementById("btnExport").disabled=false;
  }

  function renderTable(q){
    q=(q||"").trim().toLowerCase();
    var cols=[["姓名","姓名"],["状态","状态"],["部门","部门"],["岗位职务","岗位职务"],["行政职级","行政职级"],["学历","学历"],["性别","性别"],["年龄","年龄"],["司龄","司龄"],["入职日期","入职日期"]];
    var h='<table><thead><tr>'+cols.map(function(c){return '<th>'+c[0]+'</th>';}).join("")+'</tr></thead><tbody>';
    var count=0;
    currentData.forEach(function(r){
      var vals=cols.map(function(c){return clean(getField(r,c[1]));});
      if(q && !vals.join(" ").toLowerCase().includes(q)) return;
      count++;
      var st=vals[1];
      vals[1]='<span class="tag '+(st==="试用"?"tag-probation":"tag-formal")+'">'+esc(st)+'</span>';
      h+='<tr>'+vals.map(function(v,i){return '<td>'+(i===1?v:esc(v))+'</td>';}).join("")+'</tr>';
    });
    h+='</tbody></table>';
    if(!count) h='<div style="padding:24px;text-align:center;color:#A7B0BF;font-size:13px">没有匹配的记录</div>';
    document.getElementById("tableWrap").innerHTML=h;
  }

  // ---------- file parsing ----------
  function normalizeRows(rows){
    if(!rows||!rows.length) return [];
    // 找表头：前 10 行里非空单元格>=2 的第一行
    var hi=-1;
    for(var i=0;i<Math.min(rows.length,10);i++){
      var nonnull=rows[i].filter(function(c){return c!=null && String(c).trim()!=="";});
      if(nonnull.length>=2){ hi=i; break; }
    }
    if(hi<0) return [];
    var header=rows[hi], fields=[], seen={};
    for(var j=0;j<header.length;j++){
      var name=header[j]!=null?String(header[j]).trim():"";
      if(!name) continue;
      if(seen[name]!=null){ seen[name]++; name=name+"_"+seen[name]; } else seen[name]=0;
      fields.push([j,name]);
    }
    var out=[];
    for(var r=hi+1;r<rows.length;r++){
      var rec={}, any=false;
      fields.forEach(function(f){
        var v=rows[r][f[0]]!=null?rows[r][f[0]]:null;
        if(v!=null && String(v).trim()!=="") any=true;
        rec[f[1]]=v;
      });
      if(any) out.push(rec);
    }
    return out;
  }

  function parseFile(file, cb, errcb){
    var reader=new FileReader();
    reader.onerror=function(){ errcb("文件读取失败"); };
    reader.onload=function(e){
      try{
        var data=new Uint8Array(e.target.result);
        var wb=XLSX.read(data,{type:"array",cellDates:true});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:false});
        var recs=normalizeRows(rows);
        cb(recs);
      }catch(err){ errcb("解析失败："+(err&&err.message?err.message:err)); }
    };
    reader.readAsArrayBuffer(file);
  }

  // ---------- flow ----------
  function showLoading(){ hideAll(); document.getElementById("loading").hidden=false; }
  function hideAll(){
    document.getElementById("hero").hidden=true;
    document.getElementById("loading").hidden=true;
    document.getElementById("errorBox").hidden=true;
    document.getElementById("dashboard").hidden=true;
  }
  function resetApp(){
    hideAll();
    document.getElementById("hero").hidden=false;
    currentData=null; currentStats=null;
    document.getElementById("btnExport").disabled=true;
  }
  function loadRecords(recs, sourceName){
    if(!recs || !recs.length){ showError("没有识别到有效数据","未能从文件中识别出表头和数据行。请检查文件是否包含数据表，或尝试另存为 .xlsx 后重试。"); return; }
    currentData=recs;
    currentStats=computeStats();
    hideAll();
    document.getElementById("dashboard").hidden=false;
    renderDashboard();
    window.scrollTo({top:0,behavior:"smooth"});
    toast("✓ 已从 "+sourceName+" 统计 "+recs.length+" 条记录");
  }
  function showError(title,msg){
    hideAll();
    document.getElementById("errTitle").textContent=title;
    document.getElementById("errMsg").textContent=msg;
    document.getElementById("errorBox").hidden=false;
  }
  function toast(msg){
    var t=document.createElement("div"); t.className="toast show"; t.textContent=msg; document.body.appendChild(t);
    setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){t.remove();},300); },2600);
  }
  function handleFile(file){
    if(!file) return;
    var ext=file.name.split(".").pop().toLowerCase();
    if(["xlsx","xls","csv"].indexOf(ext)<0){ showError("文件格式不支持","仅支持 .xlsx / .xls / .csv 文件"); return; }
    showLoading();
    parseFile(file,function(recs){ loadRecords(recs,file.name); },function(msg){ showError("处理失败",msg); });
  }

  // ---------- export ----------
  function exportDashboard(){
    if(!currentStats) return;
    // 复制当前 DOM 的看板 + 样式，生成独立 HTML
    var css=document.querySelector('link[rel="stylesheet"]');
    var styleText="";
    try{
      var xhr=new XMLHttpRequest(); xhr.open("GET","styles.css",false); xhr.send();
      if(xhr.status===200||xhr.status===0) styleText=xhr.responseText;
    }catch(e){}
    if(!styleText && css) styleText="/* styles.css */";
    var dash=document.getElementById("dashboard").innerHTML;
    var meta=document.getElementById("dashMeta").textContent;
    var html='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>花名册数据看板</title><style>'+styleText+'</style></head><body><div class="app">'+dash+'</div></body></html>';
    var blob=new Blob([html],{type:"text/html;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a"); a.href=url; a.download="花名册数据看板.html"; a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    toast("✓ 看板已导出为 HTML 文件");
  }

  // ---------- bind ----------
  document.addEventListener("DOMContentLoaded",function(){
    var fi=document.getElementById("fileInput"), fid=document.getElementById("fileInputDrop");
    function pick(){ fi.click(); }
    document.getElementById("btnUploadTop").addEventListener("click",pick);
    document.getElementById("btnReload").addEventListener("click",pick);
    var dz=document.getElementById("dropzone");
    dz.addEventListener("click",function(){ fid.click(); });
    fid.addEventListener("change",function(e){ handleFile(e.target.files[0]); e.target.value=""; });
    fi.addEventListener("change",function(e){ handleFile(e.target.files[0]); e.target.value=""; });
    ["dragenter","dragover"].forEach(function(ev){ dz.addEventListener(ev,function(e){ e.preventDefault(); dz.classList.add("drag"); }); });
    ["dragleave","drop"].forEach(function(ev){ dz.addEventListener(ev,function(e){ e.preventDefault(); dz.classList.remove("drag"); }); });
    dz.addEventListener("drop",function(e){ handleFile(e.dataTransfer.files[0]); });

    document.getElementById("btnSample").addEventListener("click",function(){
      if(window.SAMPLE_ROSTER && window.SAMPLE_ROSTER.length){ loadRecords(window.SAMPLE_ROSTER.slice(),"示例数据"); }
      else showError("示例数据不可用","示例数据未加载，请直接上传花名册文件。");
    });
    document.getElementById("btnExport").addEventListener("click",exportDashboard);
    document.getElementById("btnExport2").addEventListener("click",exportDashboard);
    document.getElementById("tableSearch").addEventListener("input",function(e){ renderTable(e.target.value); });

    // 默认载入示例，让页面打开即有看板
    if(window.SAMPLE_ROSTER && window.SAMPLE_ROSTER.length){
      currentData=window.SAMPLE_ROSTER.slice();
      currentStats=computeStats();
      hideAll();
      document.getElementById("dashboard").hidden=false;
      renderDashboard();
    }
  });

  window.resetApp=resetApp;
})();
