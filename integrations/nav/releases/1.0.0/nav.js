//#region src/urls.ts
var e = /* @__PURE__ */ new Set([
	"https://econds.github.io/ro-tools-portal/",
	"https://econds.github.io/ro-leveling-map/",
	"https://econds.github.io/ro-reform-preparation/",
	"https://econds.github.io/dim_glacier_planner/",
	"https://econds.github.io/sessrumnir-ocean-week-guide/"
]);
function t(t) {
	return typeof t == "string" && e.has(t);
}
//#endregion
//#region integrations/nav/src/catalog.ts
var n = {
	schemaVersion: 1,
	catalogVersion: "0.1.0-design",
	tools: [
		{
			id: "leveling-map",
			title: "แผนที่เก็บเลเวล",
			canonicalUrl: "https://econds.github.io/ro-leveling-map/",
			listingStatus: "listed"
		},
		{
			id: "reform-workshop",
			title: "Reform Workshop",
			canonicalUrl: "https://econds.github.io/ro-reform-preparation/",
			listingStatus: "listed"
		},
		{
			id: "dim-glacier",
			title: "Dim Glacier Planner",
			canonicalUrl: "https://econds.github.io/dim_glacier_planner/",
			listingStatus: "listed"
		},
		{
			id: "ocean-week-guide",
			title: "Sessrumnir Ocean Week",
			canonicalUrl: "https://econds.github.io/sessrumnir-ocean-week-guide/",
			listingStatus: "listed"
		},
		{
			id: "grade-refine",
			title: "Grade & Refine Workshop",
			canonicalUrl: null,
			listingStatus: "planned"
		}
	]
}, r = (e) => typeof e == "object" && !!e && !Array.isArray(e);
function i(e) {
	if (!r(e) || e.schemaVersion !== 1 || typeof e.catalogVersion != "string" || !e.catalogVersion.length || e.catalogVersion.length > 80 || !Array.isArray(e.tools) || e.tools.length < 1 || e.tools.length > 50) throw Error("Unsupported catalog");
	let n = /* @__PURE__ */ new Set(), i = e.tools.map((e) => {
		if (!r(e) || typeof e.id != "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(e.id) || n.has(e.id) || typeof e.title != "string" || !e.title.trim() || e.title.length > 160 || /[<>\u0000-\u001f]/.test(e.title)) throw Error("Invalid tool");
		if (n.add(e.id), e.listingStatus !== "listed" && e.listingStatus !== "planned") throw Error("Unknown listing status");
		if (e.listingStatus === "listed" ? !t(e.canonicalUrl) : e.canonicalUrl !== null) throw Error("Unsafe launch URL");
		return {
			id: e.id,
			title: e.title,
			canonicalUrl: e.canonicalUrl,
			listingStatus: e.listingStatus
		};
	});
	return {
		schemaVersion: 1,
		catalogVersion: e.catalogVersion,
		tools: i
	};
}
async function a(e) {
	if (e !== "https://econds.github.io/ro-tools-portal/catalog/v1/tools.json") throw Error("Unapproved catalog endpoint");
	let t = new AbortController(), n = setTimeout(() => t.abort(), 1500);
	try {
		let n = await fetch(e, {
			signal: t.signal,
			credentials: "omit",
			redirect: "error",
			referrerPolicy: "no-referrer"
		});
		if (!n.ok || n.url !== "https://econds.github.io/ro-tools-portal/catalog/v1/tools.json" || !n.headers.get("content-type")?.includes("application/json") || !n.body) throw Error("Invalid catalog response");
		let r = n.body.getReader(), a = new TextDecoder(), o = "", s = 0;
		try {
			for (;;) {
				let e = await r.read();
				if (e.done) break;
				if (s += e.value.byteLength, s > 32768) throw Error("Oversized catalog");
				o += a.decode(e.value, { stream: !0 });
			}
			return o += a.decode(), i(JSON.parse(o));
		} finally {
			await r.cancel().catch(() => {}), r.releaseLock();
		}
	} finally {
		clearTimeout(n);
	}
}
//#endregion
//#region integrations/nav/src/nav.ts
var o = ":host{display:block;position:static;font:14px/1.6 Tahoma,\"Leelawadee UI\",sans-serif;color:#233b2c;color-scheme:light}*{box-sizing:border-box}nav{font:14px/1.6 Tahoma,\"Leelawadee UI\",sans-serif;background:var(--ro-suite-background,#f1f5ed);color:var(--ro-suite-color,#233b2c);border:1px solid #cbd7c7;border-radius:8px;padding:10px 14px}a,button{font:inherit;color:inherit;min-height:44px;display:inline-flex;align-items:center;padding:8px 12px;border-radius:5px}a{text-underline-offset:3px}button{background:#fff;color:#233b2c;border:1px solid #becbb9;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid #315d45;outline-offset:2px}.bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.current{font-weight:bold;flex:1}ul{list-style:none;padding:12px 0 0;margin:10px 0 0;border-top:1px solid #cbd7c7;display:flex;flex-wrap:wrap;gap:6px}li{margin:0}li span{display:inline-flex;align-items:center;padding:8px 12px;min-height:44px;color:#52604f}[aria-current=page]{font-weight:bold;background:#dee9d7}p{font:12px/1.6 Tahoma,sans-serif;margin:8px 0 0;color:#52604f}[hidden]{display:none!important}@media(max-width:480px){nav{padding:8px}.bar{gap:6px}.current{flex-basis:100%;order:3;padding:0 12px}button{margin-left:auto}ul{display:block}li a{width:100%}}";
function s(e, t) {
	let n = document.createElement("a");
	return n.textContent = e, n.href = t, n;
}
var c = class extends HTMLElement {
	connectedCallback() {
		if (!this.shadowRoot) try {
			this.initialize();
		} catch {}
	}
	initialize() {
		let e = i(n), r = this.getAttribute("tool-id"), c = e.tools.find((e) => e.id === r), l = this.getAttribute("portal-url"), u = l === "https://econds.github.io/ro-tools-portal/" && t(l) ? l : "https://econds.github.io/ro-tools-portal/", d = document.createElement("nav");
		d.setAttribute("aria-label", "เครื่องมือ RO");
		let f = document.createElement("div");
		if (f.className = "bar", f.append(s("กลับ RO Tools Portal", u)), d.append(f), c) {
			let t = document.createElement("span");
			t.className = "current", t.textContent = c.title, f.append(t);
			let n = document.createElement("button");
			n.type = "button", n.textContent = "เครื่องมืออื่น", n.setAttribute("aria-expanded", "false"), n.setAttribute("aria-controls", "tools");
			let i = document.createElement("div");
			i.id = "tools", i.hidden = !0;
			let o = document.createElement("ul"), l = document.createElement("p");
			l.setAttribute("role", "status"), i.append(o, l), f.append(n), d.append(i);
			let u = () => {
				let t = e.tools.map((e) => {
					let t = document.createElement("li");
					if (e.listingStatus === "listed" && e.canonicalUrl) {
						let n = s(e.title, e.canonicalUrl);
						e.id === r && n.setAttribute("aria-current", "page"), t.append(n);
					} else {
						let n = document.createElement("span");
						n.textContent = `${e.title} — อยู่ในแผน`, t.append(n);
					}
					return t;
				});
				o.replaceChildren(...t);
			}, p = (e) => {
				i.hidden = !0, n.setAttribute("aria-expanded", "false"), e && n.focus();
			}, m = !1;
			n.addEventListener("click", () => {
				let t = i.hidden;
				i.hidden = !t, n.setAttribute("aria-expanded", String(t));
				let s = this.getAttribute("catalog-url");
				if (t && s && !m) {
					if (m = !0, s !== "https://econds.github.io/ro-tools-portal/catalog/v1/tools.json") {
						l.textContent = "ใช้รายการเครื่องมือที่ติดตั้งไว้";
						return;
					}
					a(s).then((t) => {
						if (!t.tools.some((e) => e.id === r && e.title === c.title)) throw Error("Missing current identity");
						let n = o.querySelector("a:focus")?.getAttribute("href");
						e = t, u(), n && [...o.querySelectorAll("a")].find((e) => e.href === n)?.focus(), l.textContent = "";
					}).catch(() => {
						l.textContent = "อัปเดตรายการไม่ได้ ใช้รายการที่ติดตั้งไว้";
					});
				}
			}), d.addEventListener("keydown", (e) => {
				e.key === "Escape" && !i.hidden && (e.preventDefault(), p(!0));
			}), d.addEventListener("focusout", (e) => {
				e.relatedTarget instanceof Node && !d.contains(e.relatedTarget) && p(!1);
			}), u();
		}
		let p = document.createElement("style");
		p.textContent = o, this.attachShadow({ mode: "open" }).append(p, d);
	}
};
customElements.get("ro-suite-nav") || customElements.define("ro-suite-nav", c);
//#endregion
export { c as RoSuiteNav };
