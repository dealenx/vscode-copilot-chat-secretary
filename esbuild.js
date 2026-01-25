const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Функция для рекурсивного копирования директории
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Функция для копирования ресурсов
function copyResources() {
    const resourcesDir = path.join(__dirname, 'resources');
    const outResourcesDir = path.join(__dirname, 'out', 'resources');

    // Создаем папку out/resources если её нет
    if (!fs.existsSync(outResourcesDir)) {
        fs.mkdirSync(outResourcesDir, { recursive: true });
    }

    // Копируем все файлы и директории из resources в out/resources
    if (fs.existsSync(resourcesDir)) {
        const entries = fs.readdirSync(resourcesDir, { withFileTypes: true });
        entries.forEach(entry => {
            const srcPath = path.join(resourcesDir, entry.name);
            const destPath = path.join(outResourcesDir, entry.name);

            if (entry.isDirectory()) {
                copyDirRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
        console.log('Resources copied to out/resources');
    }
}

async function main() {
    // Копируем ресурсы перед сборкой
    copyResources();

    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        platform: 'node',
        outfile: 'out/extension.js',
        external: ['vscode'],
        logLevel: 'info',
    });

    if (watch) {
        await ctx.watch();
        console.log('Watching for changes...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
