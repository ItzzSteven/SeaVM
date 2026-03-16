const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- THE AUTO-MAPPER TABLE ---
// Add any console-specific functions here to map them to SeaVM hooks.
const AUTO_MAP_HEADER = `
#ifndef SEAVM_AUTOMAP_H
#define SEAVM_AUTOMAP_H

// Graphics Mapping (e.g., GX or GXM to WebGL)
#define GX_DrawTriangles(n) SeaVM_RenderTriangles(n)
#define SCE_GXM_SET_CLEAR_COLOR(c) SeaVM_SetBGColor(c)

// Controller Mapping (e.g., Pad to Browser Gamepad API)
#define PAD_GetState(id) SeaVM_GetGamepad(id)

// Internal SeaVM Hooks (JS Implementation)
extern void SeaVM_RenderTriangles(int n);
extern void SeaVM_SetBGColor(int hex);
extern int  SeaVM_GetGamepad(int id);

#endif
`;

rl.question('Enter the LCE source directory path: ', (dirPath) => {
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

    if (!fs.existsSync(dirPath)) {
        console.error("Error: Directory not found.");
        process.exit(1);
    }

    // 1. Inject Auto-Mapper Header
    const mapHeaderPath = path.join(dirPath, 'seavm_automap.h');
    fs.writeFileSync(mapHeaderPath, AUTO_MAP_HEADER);

    // 2. Gather all C/C++ Source Files
    const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.c') || file.endsWith('.cpp'))
        .map(file => path.join(dirPath, file))
        .join(' ');

    const tempWasm = path.join(distDir, "engine.wasm");
    console.log(`[SeaVM] Auto-Mapping and Compiling project...`);

    try {
        // 3. Compile to Obfuscated Binary
        // -include forces the auto-mapper into every source file
        execSync(`emcc ${files} -include ${mapHeaderPath} -I${dirPath} -o ${tempWasm} -O3 -s WASM=1 -s STRIP_SYMBOLS=1 --no-entry`);

        const wasmBase64 = fs.readFileSync(tempWasm).toString('base64');

        // 4. Generate the Final Protected HTML
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>SeaVM Runtime: LCE Engine</title>
    <style>body { margin: 0; background: #000; color: #fff; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }</style>
</head>
<body>
    <div id="loader">SeaVM: Loading Engine...</div>
    <canvas id="seavm_view" style="display:none;"></canvas>
    <script>
        const seaBinary = "${wasmBase64}";
        const bytes = Uint8Array.from(atob(seaBinary), c => c.charCodeAt(0));
        
        const runtime = {
            env: {
                memory: new WebAssembly.Memory({initial: 256, maximum: 8192}),
                // JS Implementation of the Auto-Mapper Hooks
                SeaVM_RenderTriangles: (n) => { /* WebGL Logic */ },
                SeaVM_SetBGColor: (c) => { document.body.style.backgroundColor = "#" + c.toString(16).padStart(6, '0'); },
                SeaVM_GetGamepad: (id) => { return navigator.getGamepads()[id] ? 1 : 0; }
            }
        };

        WebAssembly.instantiate(bytes, runtime).then(sea => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('seavm_view').style.display = 'block';
            console.log("SeaVM: LCE Engine Booted.");
            if(sea.instance.exports.main) sea.instance.exports.main();
        });
    </script>
</body>
</html>`;

        fs.writeFileSync(path.join(distDir, "index.html"), htmlTemplate);
        
        // Cleanup
        fs.unlinkSync(tempWasm);
        fs.unlinkSync(mapHeaderPath);
        
        console.log(`\n[SeaVM] DONE! Build ready in /dist/index.html`);
    } catch (err) {
        console.error("[SeaVM] Compilation failed. Check your C++ syntax or Emscripten install.");
    }
    rl.close();
});
