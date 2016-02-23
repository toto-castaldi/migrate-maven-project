var fs = require('fs');

function MavenProject (folder) {
  this.folder = undefined;
};

var copyRecursiveSync = function(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.linkSync(src, dest);
  }
};

var folderCheck = function (folder, callback) {
  fs.stat(folder, function (err,stats) {
      if (!err) {
        if (stats.isDirectory()) {
            callback(folder);
        } else {
            console.log(folder , "is not a folder");
        }
      } else {
        console.log("can't access to ", folder);
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
  if (argv && argv.length > 3) {
    var sourceFolder = argv[2];
    var destFolder = argv[3];

    folderCheck(destFolder, function (destFolder) {
        mavenProjectBuilder(sourceFolder, function (mavenProject) {});
    });
  } else {
      console.log("Usage: node main.js projectFolderSource projectFolderDest");
  }
};

main(process.argv);
