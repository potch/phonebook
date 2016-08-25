var path = require('path');
var fs = require('fs');

var latestOrg = require('./phonebook.json');

if (latestOrg.timestamp) {
  console.log('no change needed');
} else {
  var book = {
    staff: latestOrg,
    count: latestOrg.length,
    timestamp: Date.now()
  };

  var selfPath = path.join(__dirname, 'phonebook.json');
  var stats = fs.statSync(selfPath);
  var d = stats.ctime;
  var dstring = d.getFullYear().toString() + ('0' + (d.getMonth() + 1)).substr(-2) + ('0' + (d.getDate() + 1)).substr(-2);
  var todayPath = path.join(__dirname, 'phonebook.' + dstring + '.json');

  fs.writeFile(selfPath, JSON.stringify(book, null, 2), function (err) {
    if (err) {
      console.log('error writing data');
    } else {
      console.log('successfully updated ', selfPath)
    }
  });
  fs.writeFile(todayPath, JSON.stringify(book, null, 2), function (err) {
    if (err) {
      console.log('error writing data');
    } else {
      console.log('successfully wrote ', todayPath)
    }
  });
}
