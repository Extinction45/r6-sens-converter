const aspectMap = {
  "4:3": 4/3,
  "16:10": 16/10,
  "16:9": 16/9,
  "21:9": 21/9
};

const scopeZooms = [1.0, 1.5, 2.5, 3.5, 5.0, 12.0];

function deg2rad(d) { return d * Math.PI / 180; }
function hfovFromV(vfov, ar) {
  return 2 * Math.atan(Math.tan(deg2rad(vfov) / 2) * ar) * 180 / Math.PI;
}
// Use new/old to match expected behaviour (lowering FOV reduces sensitivity numbers)
function scaleFactor(oldHF, newHF) {
  return Math.tan(deg2rad(newHF) / 2) / Math.tan(deg2rad(oldHF) / 2);
}
function fmt(v, p) { return p == 0 ? Math.round(v) : Number(v).toFixed(p); }

let lastResult = null;

document.getElementById("convertBtn").addEventListener("click", () => {
  const errEl = document.getElementById("errorMsg");
  const resultsEl = document.getElementById("results");
  const status = document.getElementById("status");
  errEl.textContent = "";
  resultsEl.innerHTML = "";

  const curFov = parseFloat(document.getElementById("curFov").value);
  const tarFov = parseFloat(document.getElementById("tarFov").value);
  const curAR = aspectMap[document.getElementById("curAR").value];
  const tarAR = aspectMap[document.getElementById("tarAR").value];
  const precision = parseInt(document.getElementById("precision").value, 10);

  if (!curFov || !tarFov || curFov < 60 || curFov > 90 || tarFov < 60 || tarFov > 90) {
    errEl.textContent = "FOV must be between 60 and 90.";
    return;
  }

  const base = {
    hor: parseFloat(document.getElementById("curHor").value) || 0,
    ver: parseFloat(document.getElementById("curVer").value) || 0,
    scopes: scopeZooms.map(z => parseFloat(document.getElementById("s" + z.toString().replace(".", "_")).value) || 0)
  };

  const oldHF = hfovFromV(curFov, curAR);
  const newHF = hfovFromV(tarFov, tarAR);
  const factor = scaleFactor(oldHF, newHF);

  let html = `<table><thead><tr><th>Type</th><th>Old</th><th>New</th></tr></thead><tbody>`;
  html += `<tr><td>Horizontal</td><td>${fmt(base.hor, precision)}</td><td>${fmt(base.hor * factor, precision)}</td></tr>`;
  html += `<tr><td>Vertical</td><td>${fmt(base.ver, precision)}</td><td>${fmt(base.ver * factor, precision)}</td></tr>`;

  const rows = [
    ["Horizontal", base.hor, base.hor * factor],
    ["Vertical", base.ver, base.ver * factor]
  ];

  scopeZooms.forEach((zoom, idx) => {
    const oldVal = base.scopes[idx];
    if (oldVal > 0) {
      html += `<tr><td>${zoom}× Scope</td><td>${fmt(oldVal, precision)}</td><td>${fmt(oldVal * factor, precision)}</td></tr>`;
      rows.push([`${zoom}× Scope`, oldVal, oldVal * factor]);
    }
  });

  html += `</tbody></table>`;
  resultsEl.innerHTML = html;
  status.textContent = `Converted (scale ×${factor.toFixed(4)})`;

  lastResult = { rows, factor, precision };
  document.getElementById("downloadBtn").onclick = () => downloadCSV(lastResult);
});

function downloadCSV(result) {
  if (!result) {
    alert("No results to download. Click Convert first.");
    return;
  }
  const { rows, precision } = result;
  let csv = "Type,Old,New\n";
  rows.forEach(r => {
    csv += `${r[0]},${fmt(r[1], precision)},${fmt(r[2], precision)}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "r6_sens_results.csv";
  link.click();
}
