var org = require('./phonebook.json');
var staff = org.staff;
var rootName = process.argv[2] || 'Baker';

staff = staff.map(function (e) {
  return {
    cn: e.cn,
    dn: e.dn,
    manager: e.manager,
    title: e.title
  };
});

var root = staff.filter(function (e) {
  return e.cn.indexOf(rootName) > -1;
})[0];

if (!root) {
  console.log("Couldn't find", rootName, "...");
  console.log("Search is case sensitive and greedy.");
  console.log("Please revise and try again.");
  return;
}

console.log(root.cn);
root.walked = true;
getReports(root);

function getReports(node) {
  node.reports = staff.filter(function (e) {
    if (!e.walked && e.manager && e.manager.dn === node.dn) {
      e.walked = true;
      console.log(e.cn);
      return true;
    }
    return false;
  });
  node.reports.forEach(getReports);
}

var managers = staff.filter(function (e) {
  for (var i=0; i < staff.length; i++) {
    if (staff[i].manager && staff[i].manager.dn === e.dn) {
      return true;
    }
  }
  return false;
});
