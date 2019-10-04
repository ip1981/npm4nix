Npm4nix
=======

Npm4nix converts Node.js packages into a single Nix build expression
for the [Npm.nix](https://github.com/ip1981/npm.nix) project. Npm4nix is
inspired by [Cabal2nix](https://github.com/NixOS/cabal2nix). Unfortunately,
[npm2nix](https://github.com/NixOS/npm2nix) is already taken :) Thus,
`npm4nix`.  It supports local directories and tarballs (e. g. `*.tgz`),
remote tarballs, remote [Git](https://git-scm.com/) respositories.


Requirements
============

Npm4nix is written in JavaScript with minimum number of depednecies
and should be executed by [Node.js](https://nodejs.org).
Npm4nix invokes [curl](https://curl.haxx.se/),
Git, [GNU Tar](https://www.gnu.org/software/tar/), and
[nix-hash](https://nixos.org/nix/manual/#sec-nix-hash), so these tools should
be installed.


Example
=======


```
$ node cmd/main.js https://github.com/substack/node-mkdirp.git > mkdirp.nix
executing git clone 'https://github.com/substack/node-mkdirp.git' '/tmp/npm4nix-Feo4WM'
Cloning into '/tmp/npm4nix-Feo4WM'...
executing git -C '/tmp/npm4nix-Feo4WM' rev-parse HEAD
executing nix-hash --base32 --type sha256 '/tmp/npm4nix-Feo4WM'

$ cat mkdirp.nix
{ fetchgit, buildNpmPackage, minimist, mock-fs, tap }:

buildNpmPackage {
  pname = "mkdirp";
  version = "0.5.1";
  src = fetchgit {
    url = "https://github.com/substack/node-mkdirp.git";
    rev = "f2003bbcffa80f8c9744579fabab1212fc84545a";
    sha256 = "0qc3l6571aknhlmzcyaah3plmf852cl160jihy3l4b05j25qv45a";
  };

  meta = {
    description = "Recursively mkdir, like `mkdir -p`";
    homepage = "";
    license = "MIT";
  };

  npmInputs = [
    minimist mock-fs tap
  ];
}
```

```
$ node cmd/main.js https://github.com/cowboy/javascript-sync-async-foreach/archive/v0.1.3.tar.gz > async-foreach.nix
executing curl -LsSf -o '/tmp/npm4nix-zwGeOX/v0.1.3.tar.gz' 'https://github.com/cowboy/javascript-sync-async-foreach/archive/v0.1.3.tar.gz'
executing nix-hash --flat --base32 --type sha256 '/tmp/npm4nix-zwGeOX/v0.1.3.tar.gz'
executing tar -xOf '/tmp/npm4nix-zwGeOX/v0.1.3.tar.gz' --wildcards '*/package.json'

$ cat async-foreach.nix
{ fetchurl, buildNpmPackage }:

buildNpmPackage {
  pname = "async-foreach";
  version = "0.1.3";
  src = fetchurl {
    url = "https://github.com/cowboy/javascript-sync-async-foreach/archive/v0.1.3.tar.gz";
    sha256 = "1b7h2fgj6rndkviyx1hl0mh72d60a2b2f1sl86ndk8vdvr6mxmj3";
  };

  meta = {
    description = "An optionally-asynchronous forEach with an interesting interface.";
    homepage = "http://github.com/cowboy/javascript-sync-async-foreach";
    license = "";
  };

  npmInputs = [

  ];
}

```
