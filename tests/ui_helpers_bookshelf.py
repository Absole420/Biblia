# Shared Playwright snippet (copied into browser_automation scripts) for PersonalBookshelf edit-mode tests
BOOKS_JS = """()=>{const out={};document.querySelectorAll('[data-testid^="shelf-"]').forEach(s=>{out[s.dataset.testid]=Array.from(s.querySelectorAll('[data-testid^="open-"],[data-testid^="library-tab-"]')).map(b=>b.dataset.testid)});return out}"""
LAYOUT_JS = """()=>{const r=[];for(const k of Object.keys(localStorage)){if(k.includes('guardian_live')){const ll=(localStorage.getItem(k)||'').match(/"libraryLayout":(\\[[^\\]]*\\])/);r.push(k+' => '+(ll?ll[1]:'none'))}}return r}"""
