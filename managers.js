var org = require('./phonebook.json');
var staff = org.staff;

staff = staff.map(function (e) {
  return {
    cn: e.cn,
    dn: e.dn,
    manager: e.manager,
    title: e.title
  };
});

var root = staff.filter(function (e) {
  return e.cn.indexOf('Baker') > -1;
})[0];

root.walked = true;
getReports(root);

function getReports(node) {
  node.reports = staff.filter(function (e) {
    if (!e.walked && e.manager && e.manager.dn === node.dn) {
      e.walked = true;
      return true;
    }
    return false;
  });
  node.reports.forEach(getReports);
}

console.log(staff);

var managers = staff.filter(function (e) {
  for (var i=0; i < staff.length; i++) {
    if (staff[i].manager && staff[i].manager.dn === e.dn) {
      return true;
    }
  }
  return false;
});

console.log(managers.length/staff.length * 100);
