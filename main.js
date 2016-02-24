var fs = require('fs');
var path = require('path');
var replace = require("replace");
var fsExtra = require('fs-extra');

function MavenProject (folder) {
  var self = this;

  this.folder = folder;

  this.migrate = function (destFolder, sourcePackage, destPackage) {
    var dest = path.join(destFolder, 'pom.xml');
    fsExtra.copySync(path.join(self.folder, 'pom.xml'), dest);
    copyRecursiveSync(path.join(self.folder , '/src'), path.join(destFolder, '/src'));

    var conf = {
        regex: sourcePackage,
        replacement: destPackage,
        paths: [destFolder],
        recursive: true,
        silent: true,
    };

    replace(conf);

    moveFolder(sourcePackage, destPackage, path.join(destFolder, '/src/main/java'));
    moveFolder(sourcePackage, destPackage, path.join(destFolder, '/src/test/java'));
  };
};

var moveFolder = function (sourcePackage, destPackage, folder) {
  console.log('moveFolder',sourcePackage, destPackage, folder);

  var sourceFolders = sourcePackage.split('.');
  if (sourceFolders.length > 0 && sourceFolders[0].length > 0) {
    var destFolders = destPackage.split('.');
    var sourceFolder = path.join(folder, '/' + sourceFolders[0]);
    var d = path.join(folder, '/' + destFolders[0]);
    console.log('move', sourceFolder, d);
    fsExtra.move(sourceFolder, d, {}, function (err) {
       if (!err) {
         moveFolder(sourceFolders.slice(1).join('.'), destFolders.slice(1).join('.'), d);
       }
    });
  } else {
    var readdirSync = fs.readdirSync(folder);
    var lastFolder = path.join(folder, destPackage);
    fsExtra.mkdirpSync(lastFolder);
    readdirSync.forEach(function (r) {
        var mS = path.join(folder, r);
        var mD = path.join(lastFolder, r);

        console.log('move', mS, mD);
        fsExtra.move(mS, mD, {}, function (err) { if (err) console.log(err);});
    });
    //console.log('move', folder, path.join(folder, destPackage));
    //fsExtra.move(folder, path.join(folder, destPackage), {}, function (err) {
    //});
  }
};

var findFolder = function(container, name) {
  var p = path.join(container, name );
  var exists = fs.existsSync(p);
  var stats = exists && fs.statSync(p);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    return p;
  } else {
    var readdirSync = fs.readdirSync(container);
    console.log(readdirSync);
  }
  return undefined;
};

var copyRecursiveSync = function(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fsExtra.copySync(src, dest);
  }
};

var folderCheck = function (folder, callback) {
  fs.stat(folder, function (err,stats) {
      if (!err) {
        if (stats.isDirectory()) {
            callback(folder);
        } else {
            console.log(folder , 'is not a folder');
        }
      } else {
        console.log('can\'t access to ', folder);
      }
    }
  );
};

var mavenProjectBuilder = function (folder, creationCallback) {
  folderCheck(folder, function (folder) {
    creationCallback(new MavenProject(folder));
  });
};

function main (argv) {
  if (argv && argv.length > 5) {
    var sourceFolder = argv[2];
    var destFolder = argv[3];
    var sourcePackage = argv[4];
    var destPackage = argv[5];

    folderCheck(destFolder, function (destFolder) {
        mavenProjectBuilder(sourceFolder, function (mavenProject) {
          mavenProject.migrate(destFolder, sourcePackage, destPackage);
        });
    });
  } else {
      console.log('Usage: node main.js projectFolderSource projectFolderDest sourceGroupId destGroupId');
  }
};

main(process.argv);
