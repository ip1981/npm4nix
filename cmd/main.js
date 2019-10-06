#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const {
    execSync
} = require('child_process');

const render = require('../lib/template');

var url = null,
    revision = null;

function log(msg) {
    console.error(msg);
}

function printHelp() {
    console.log(`
npm4nix converts NPM packages into build instructions for Nix.

Usage: npm4nix [options] URL

Options:
  -r, --revision revision to fetching from Git (tag, branch, hash)
  -h, --help     show this help screen

URL can be:
  - a local directory with package.json
  - a local archive (tarball)
  - a remote Git URL
  - a remote archive (tarball)

Examples:

  $ npm4nix -r 0.5.1 https://github.com/substack/node-mkdirp.git > mkdirp.nix
  $ npm4nix . > mypkg.nix
  `);
}

function exec(cmd) {
    log(`executing ${cmd}`);
    return execSync(cmd, {
        encoding: 'utf-8'
    }).trim();
}

function getSHA256(p) {
    var flat = '';
    if (fs.statSync(p).isFile()) {
        flat = ' --flat';
    }

    return exec(`nix-hash${flat} --base32 --type sha256 '${p}'`);
}

function mkdtemp() {
    const tmpdir = os.tmpdir();
    return fs.mkdtempSync(`${tmpdir}${path.sep}npm4nix-`);
}

function rmTree(dir) {
    fs.readdirSync(dir).forEach(function(entry, index) {
        const p = path.join(dir, entry);
        if (fs.lstatSync(p).isDirectory()) {
            rmTree(p);
        } else {
            fs.unlinkSync(p);
        }
    });
    fs.rmdirSync(dir);
};

function readPackage(p) {
    var pkgFile = path.join(p, 'package.json');
    return JSON.parse(fs.readFileSync(pkgFile));
}

function isLocal(p) {
    return fs.existsSync(p);
}

function localSrc(p) {
    return {
        pkg: readPackage(p),
        src: p
    };
}

function isArchive(url) {
    return url.match(new RegExp('(https?://)?.+/[^/]+\.t(ar\.)?(gz|bz2|xz)', 'i'));
}

function fetchurl(url) {
    const dir = mkdtemp();
    const file = path.join(dir, path.basename(url));
    var sha256, pkg;
    try {
        exec(`curl -LsSf -o '${file}' '${url}'`);
        sha256 = getSHA256(file);
        pkg = JSON.parse(exec(`tar -xOf '${file}' --wildcards --no-wildcards-match-slash '*/package.json'`));
    } finally {
        rmTree(dir);
    }
    return {
        pkg: pkg,
        src: {
            fetch: 'fetchurl',
            url: url,
            sha256: sha256
        }
    };
}

function isGit(url) {
    return url.match(new RegExp('(.*https://)?(github|gitlab)\.com/[^/]+/[^/]+(\.git)?$', 'i')) ||
        url.match(new RegExp('(.*https://)?bitbucket\.org/[^/]+/[^/]+(\.git)?$', 'i')) ||
        url.match(new RegExp('^git(\\+https)?://.+', 'i'));
}

function fetchgit(url) {
    const dir = mkdtemp();
    var rev, sha256, pkg;
    try {
        exec(`git clone '${url}' '${dir}'`);
        if (revision !== null) {
            exec(`git -C '${dir}' checkout '${revision}'`);
        }
        rev = exec(`git -C '${dir}' rev-parse HEAD`);
        rmTree(path.join(dir, '.git'));
        sha256 = getSHA256(dir);
        pkg = readPackage(dir);
    } finally {
        rmTree(dir);
    }
    return {
        pkg: pkg,
        src: {
            fetch: 'fetchgit',
            rev: rev,
            sha256: sha256
        }
    };
}


const args = process.argv.slice(2);

for (var i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '-r':
        case '--revision':
            revision = args[++i];
            break;
        case '-h':
        case '--help':
            printHelp();
            process.exit();
            break;
        default:
            url = args[i];
    }
}

if (url === null) {
    log('Missing URL. Add --help for usage info');
    process.exit(1);
}

if (isLocal(url)) {
    console.log(render(localSrc(url)));
} else if (isGit(url)) {
    console.log(render(fetchgit(url)));
} else if (isArchive(url)) {
    console.log(render(fetchurl(url)));
} else {
    log(`unsupported URL: '${url}'`);
    process.exit(1);
}