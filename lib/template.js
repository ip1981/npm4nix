// XXX We will never use in our builds.
// XXX Original names, e. g. "@foo/bar".
const devDepsBlackList = [
    "better-npm-run",
    "doctoc",
    "eslint",
    "husky",
    "lint-staged",
    "live-server",
    "npm-run-all",
    "watch",
];

function normalize(name) {
    return name.replace('/', '-').replace('@', '').replace('.', '-');
}

function fmt(words, maxLine, glue1, glue2) {
    var line = [];
    var lines = []
    var lineLength = 0;

    for (var i = 0; i < words.length; i++) {
        const itemLength = glue1.length + words[i].length
        if (itemLength + lineLength <= maxLine || line.length === 0) {
            line.push(words[i]);
            lineLength += itemLength;
        } else {
            lines.push(line);
            line = [words[i]];
            lineLength = itemLength;
        }
    }

    lines.push(line);

    lines = lines.map((l) => {
        return l.join(glue1);
    });

    return lines.join(glue2);
}


function render({
    src,
    pkg
}) {
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    var dropDevDependencies = [];

    devDepsBlackList.forEach((d) => {
        if (devDeps[d]) {
            delete devDeps[d];
            dropDevDependencies.push(d);
        }
    });

    const npmInputs = Object.keys({...deps,
        ...devDeps
    }).sort().map(normalize);
    const args = ['buildNpmPackage', ...npmInputs];

    var source = '';

    if ('string' === typeof src) {
        if (!src.startsWith('/') && !src.startsWith('./') && !src.startsWith('../')) {
            src = `./${src}`;
        }
        source = `  src = ${src};`;
    } else {
        args.unshift(src.fetch);
        switch (src.fetch) {
            case 'fetchurl':
                source = `\
  src = ${src.fetch} {
    url = "${src.url}";
    sha256 = "${src.sha256}";
  };`;
                break;
            case 'fetchgit':
                source = `\
  src = ${src.fetch} {
    url = "${src.url}";
    rev = "${src.rev}";
    sha256 = "${src.sha256}";
  };`;
                break;
        }
    }

    return `\
{ ${fmt(args, 90, ', ', '\n, ')} }:

buildNpmPackage {
  pname = "${pkg.name}";
  version = "${pkg.version}";
${source}

  meta = {
    description = ${JSON.stringify (pkg.description || '')};
    homepage = "${pkg.homepage || ''}";
    license = "${pkg.license || ''}";
  };

  npmInputs = [
    ${fmt(npmInputs, 80, ' ', '\n    ')}
  ];

  dropDevDependencies = [
    ${fmt(dropDevDependencies.sort().map(d => `"${d}"`), 80, ' ', '\n    ')}
  ];
}
  `;
}

module.exports = render;
