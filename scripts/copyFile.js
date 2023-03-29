const fs = require('fs');
const path = require('path');

function copy(from, to) {
  const fromPath = path.resolve(from);
  const toPath = path.resolve(to);
  fs.access(toPath, function (err) {
    if (err) {
      fs.mkdirSync(toPath);
    }
  });

  fs.readdir(fromPath, function (err, paths) {
    if (err) {
      console.log(err);
      return;
    }

    for (const item of paths) {
      const newFromPath = fromPath + '\\' + item;
      const newToPath = path.resolve(toPath + '/' + item);
      if (newFromPath.includes('node_modules')) continue;
      if (newFromPath.includes('.git')) continue;
      fs.stat(newFromPath, function (err, stat) {
        if (err) return;
        if (stat.isFile()) {
          copyFile(newFromPath, newToPath);
          console.log(newToPath);
        }
        if (stat.isDirectory()) {
          copy(newFromPath, newToPath);
        }
      });
    }
  });
}

function copyFile(from, to) {
  fs.copyFileSync(from, to);
}

copy('./', '../oneworld-ferdium/recipes');
