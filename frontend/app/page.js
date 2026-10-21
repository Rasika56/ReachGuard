"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkHealth, runScan } from "../lib/api";

function Badge({ value }) {
  const key = String(value || "UNKNOWN").toUpperCase();
  return <span className={`status ${["REACHABLE","UNREACHABLE","UNKNOWN","CRITICAL","HIGH","MEDIUM","LOW"].includes(key) ? key : "UNKNOWN"}`}>{key}</span>;
}
function Stat({ label, value, foot }) {
  return <div className="stat"><div className="statlabel">{label}</div><div className="statvalue">{value}</div><div className="statfoot">{foot}</div></div>;
}
function Detail({ title, children }) {
  return <div><div className="detailtitle">{title}</div><div className="detailtext">{children || "Not provided by analyzer."}</div></div>;
}

export default function Home() {
  const [backend, setBackend] = useState("checking");
  const [theme, setTheme] = useState("dark");
  const [useMock, setUseMock] = useState(true);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [reachFilter, setReachFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [openId, setOpenId] = useState(null);
  const fileInput = useRef(null);
  const folderInput = useRef(null);

  useEffect(() => { checkHealth().then(ok => setBackend(ok ? "online" : "offline")); }, []);
  const findings = scan?.findings || [];
  const counts = useMemo(() => ({
    REACHABLE: findings.filter(f => f.reachabilityStatus === "REACHABLE").length,
    UNREACHABLE: findings.filter(f => f.reachabilityStatus === "UNREACHABLE").length,
    UNKNOWN: findings.filter(f => f.reachabilityStatus === "UNKNOWN").length
  }), [findings]);
  const visible = useMemo(() => findings.filter(f => {
    if (reachFilter !== "ALL" && f.reachabilityStatus !== reachFilter) return false;
    if (severityFilter !== "ALL" && f.severity !== severityFilter) return false;
    const q = query.toLowerCase().trim();
    return !q || [f.package,f.version,f.vulnerabilityId,f.summary,f.filePath,f.functionName,f.vulnerableSymbol].some(v => String(v || "").toLowerCase().includes(q));
  }).sort((a,b) => ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}[a.severity] ?? 4)-({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}[b.severity] ?? 4)), [findings,reachFilter,severityFilter,query]);

  function addFiles(list) {
    const chosen = Array.from(list || []).filter(f => !f.name.startsWith(".") || f.name === ".env.example");
    setFiles(chosen);
    setError("");
    if (chosen.length) setUseMock(false);
  }
  async function scanProject(sample = false) {
    setLoading(true); setError(""); setScan(null); setOpenId(null);
    try {
      const result = await runScan({ useMock: sample || useMock, files: sample || useMock ? [] : files });
      setScan(result);
    } catch (e) { setError(e.message || "Scan failed."); }
    finally { setLoading(false); checkHealth().then(ok => setBackend(ok ? "online" : "offline")); }
  }
  function dropFiles(e) {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }

  return <div className={`app theme-${theme}`}>
    <header className="topbar"><div className="shell topbarinner">
      <div className="brand"><div className="logo">⬡</div><div><div className="brandname">ReachGuard</div><div className="subbrand">SBOM intelligence · code reachability · risk triage</div></div></div>
      <div className="topright"><span className="pill"><i className="dot" style={{background:backend==="online"?"#43d6a0":backend==="offline"?"#fb7185":"#fbbf24"}}/>Backend {backend}</span><button className="themebtn" type="button" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label="Toggle color theme">{theme==="dark"?"☀ Light mode":"☾ Dark mode"}</button></div>
    </div></header>
    <main className="shell">
      <section className="hero"><div><div className="eyebrow">Reachability-aware security analysis</div><h1>Find vulnerabilities.<br/><span className="gradient">Trace the code.</span></h1><p className="lead">See where vulnerable dependencies appear, whether affected code is reachable, and what evidence supports each result.</p></div>
        <div className="heroart"><div className="artlabel"><strong>Clear findings. Better decisions.</strong><span>Dependency insight · code-level evidence</span></div></div>
      </section>

      <section className="panel">
        <div className="panelhead"><div><h2>01 / Add a project</h2><div className="muted">Upload source files or select a folder. Or run the sample to explore the interface.</div></div></div>
        <div className="uploadgrid">
          <div className={`dropzone ${dragging?"dragging":""}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={dropFiles}>
            <div className="dropicon">⇧</div><strong>Drop your project files here</strong><p>Drag files into this box. Folder drag-and-drop support depends on your browser.</p>
            <button className="btn" type="button" onClick={()=>fileInput.current?.click()}>Choose files</button>
            <input ref={fileInput} type="file" multiple hidden onChange={e=>addFiles(e.target.files)}/>
          </div>
          <div className="dropzone">
            <div className="dropicon">▧</div><strong>Or choose a project folder</strong><p>Folder selection preserves relative paths where supported. Avoid uploading secrets, credentials, or production data.</p>
            <button className="btn" type="button" onClick={()=>folderInput.current?.click()}>Choose folder</button>
            <input ref={folderInput} type="file" multiple webkitdirectory="" directory="" hidden onChange={e=>addFiles(e.target.files)}/>
          </div>
        </div>
        <div className="sampleline"><div className="muted">{files.length ? <><b style={{color:"#d9eaff"}}>{files.length} file(s) selected</b> · {files.slice(0,3).map(f=>f.webkitRelativePath||f.name).join(", ")}{files.length>3?" …":""}</> : "No source selected yet. Use a sample scan to preview the interface."}</div>
          <button className="btn ghost" type="button" onClick={()=>{setFiles([]);if(fileInput.current)fileInput.current.value="";if(folderInput.current)folderInput.current.value="";}}>Clear selection</button>
          <label className="muted" style={{display:"flex",alignItems:"center",gap:7}}><input type="checkbox" checked={useMock} onChange={e=>setUseMock(e.target.checked)}/> Use demo data</label>
          <button className="btn primary" disabled={loading || (!useMock && !files.length)} onClick={()=>scanProject(false)}>{loading?"Analyzing…":"Analyze uploaded project"}</button>
          <button className="btn" disabled={loading} onClick={()=>scanProject(true)}>Run sample scan</button>
        </div>
        {loading && <><div className="progress"><span/></div><p className="muted">Waiting for SBOM generation, vulnerability matching, and reachability evidence…</p></>}
        {error && <div className="error">{error}<div className="small">The scan failed; this must not be interpreted as a clean result. Confirm the backend endpoint supports multipart file uploads.</div></div>}
      </section>

      <div className="stats">
        <Stat label="Components identified" value={scan?scan.componentCount:"—"} foot="Packages in returned SBOM"/>
        <Stat label="Vulnerability findings" value={scan?findings.length:"—"} foot="Advisories matched by analyzer"/>
        <Stat label="Locations mapped" value={scan?findings.filter(f=>f.filePath!=="Not established"&&f.functionName!=="Not established").length:"—"} foot="Findings with file and function"/>
        <Stat label="High / critical" value={scan?findings.filter(f=>["HIGH","CRITICAL"].includes(f.severity)).length:"—"} foot="Severity from scan response"/>
      </div>

      <section className="panel">
        <div className="panelhead"><div><h2>02 / Reachability classification</h2><div className="muted">The three outcomes are mutually exclusive. A missing call path alone is not proof of unreachability.</div></div>{scan&&<span className="pill">Target: {scan.target}</span>}</div>
        <div className="stategrid">
          <div className="statecard"><div className="statehead"><Badge value="REACHABLE"/> <span className="statecount">{scan?counts.REACHABLE:"—"}</span></div><div className="statehint">Evidence supports a path from an application entry point to the affected function or symbol.</div></div>
          <div className="statecard"><div className="statehead"><Badge value="UNREACHABLE"/> <span className="statecount">{scan?counts.UNREACHABLE:"—"}</span></div><div className="statehint">No path found with adequate analysis coverage and sufficiently complete dependency/call-graph evidence.</div></div>
          <div className="statecard"><div className="statehead"><Badge value="UNKNOWN"/> <span className="statecount">{scan?counts.UNKNOWN:"—"}</span></div><div className="statehint">Evidence is missing, incomplete, ambiguous, or unsupported by the analyzer; investigate rather than assume.</div></div>
        </div>
        {scan?.isMock && <div className="banner"><b>Demo data only.</b> All findings, paths, line numbers, and statuses in this sample are simulated to demonstrate the interface. They are not analysis of your code.</div>}
        {scan?.warnings?.length>0 && <div className="banner">{scan.warnings.map((w,i)=><div key={i}>{w}</div>)}</div>}
      </section>

      <section className="panel results-panel">
        <div className="panelhead"><div><h2>03 / Findings explorer</h2><div className="muted">Expand any row for source location, symbol, dependency-use evidence, call path, and reasoning.</div></div><span className="pill">{scan?`${visible.length} of ${findings.length} findings`:"Waiting for scan"}</span></div>
        <div className="filters"><input className="field search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search package, CVE, file, function or symbol…"/><select className="field" value={reachFilter} onChange={e=>setReachFilter(e.target.value)}><option value="ALL">All reachability states</option><option>REACHABLE</option><option>UNREACHABLE</option><option>UNKNOWN</option></select><select className="field" value={severityFilter} onChange={e=>setSeverityFilter(e.target.value)}><option value="ALL">All severities</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></div>
        {!scan ? <div className="empty">Upload a project and run an analysis, or choose “Run sample scan” to preview the dashboard.</div> : visible.length===0 ? <div className="empty">No findings match the selected filters.</div> :
          <div className="tablewrap"><table><thead><tr><th>Package / version</th><th>Advisory</th><th>Severity</th><th>Reachability</th><th>File / function</th><th>Priority</th><th>Evidence</th></tr></thead><tbody>
            {visible.map(f=><React.Fragment key={f.id}>
              <tr className="finding" onClick={()=>setOpenId(openId===f.id?null:f.id)} style={{cursor:"pointer"}}>
                <td><div className="pkg">{f.package}</div><div className="small">{f.version}</div></td>
                <td><div className="code">{f.vulnerabilityId}</div><div className="small">{f.summary}</div></td>
                <td><Badge value={f.severity}/></td><td><Badge value={f.reachabilityStatus}/><div className="small">{f.evidenceType}</div></td>
                <td><div className="code">{f.filePath}</div><div className="small">{f.functionName}{f.lineStart?` · L${f.lineStart}${f.lineEnd?`–${f.lineEnd}`:""}`:""}</div></td>
                <td><div className="priority">{f.priority}</div><div className="small">CVSS: {f.cvss??"N/A"} · EPSS: {f.epss??"N/A"} · KEV: {f.kev==null?"N/A":String(f.kev)}</div></td>
                <td><span className="pill">{openId===f.id?"Hide details":"Inspect ↗"}</span></td>
              </tr>
              {openId===f.id&&<tr className="details"><td colSpan="7"><div className="detailgrid">
                <Detail title="Exact vulnerable location"><div className="callpath">{`File: ${f.filePath}\nFunction: ${f.functionName}\nSymbol: ${f.vulnerableSymbol}\nLines: ${f.lineStart??"?"}${f.lineEnd?`–${f.lineEnd}`:""}`}</div></Detail>
                <Detail title="Why this reachability state"><div>{f.reachabilityBasis}<p className="small">Evidence complete: {f.evidenceComplete?"reported complete":"not established / incomplete"}.</p></div></Detail>
                <Detail title="Is the library actually used?"><div>{f.dependencyUsage}<p className="small">This field must be backed by import/reference/call-graph evidence from the backend. Presence in an SBOM alone does not prove that a library function is called.</p></div></Detail>
                <Detail title="Call / dependency path"><div className="callpath">{f.dependencyPath.length?f.dependencyPath.join("\n→ "):"No path supplied by analyzer."}</div></Detail>
                <Detail title="Vulnerability summary">{f.summary}</Detail>
                <Detail title="Advisory references">{f.references.length?f.references.map((url,i)=><div key={i}><a href={url} target="_blank" rel="noreferrer">{url}</a></div>):"No advisory references returned."}</Detail>
              </div></td></tr>}
            </React.Fragment>)}
          </tbody></table></div>}
      </section>
      <div className="banner" style={{marginTop:20}}><b>Evidence boundary:</b> ReachGuard's intended result is a traceable, uncertainty-aware prioritization—not a guarantee of exploitability or security. Exact file/function mapping and real reachability classifications require backend static-analysis and call-graph support; the frontend displays these fields but cannot infer them safely on its own.</div>
      <footer className="footer">REACHGUARD · SBOM + vulnerability intelligence + function-level reachability · Prototype interface</footer>
    </main>
  </div>;
}

// React.Fragment is referenced explicitly for row groups.
import React from "react";
