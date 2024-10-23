import { spawn } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";

const useCasesDir = 'dist/test/simple-use-cases'
const useCases = readdirSync('dist/test/simple-use-cases').filter(file => file.endsWith('.js'));

useCases.forEach(file => {
    console.log(`Running ${file}...`);
    const path = join(useCasesDir, file);

    const child = spawn('node', [path], { stdio: 'inherit' });

    child.on('exit', (code) => {
        console.log(`${file} exited with code ${code}`);
    });
});