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

var reportsTotal = 0;

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

var managers = staff.filter(function (e) {
  for (var i=0; i < staff.length; i++) {
    if (staff[i].manager && staff[i].manager.dn === e.dn) {
      return true;
    }
  }
  return false;
});

function getAllUnderlings(node) {
  var num = 0;
  node.reports.forEach(function (node) {
    num += 1;
    num += getAllUnderlings(node);
  });
  node.totalManaged = num;
  return num;
}

getAllUnderlings(root);

var reportsArray = []

managers.sort(function (a, b) {
  return b.totalManaged - a.totalManaged;
}).forEach(function (m) {
  if (m.reports) {
    reportsTotal += m.reports.length;
    reportsArray.push(m.reports.length);
  }
  // console.log(m.cn + '  ' + m.title + '  ' + m.totalManaged);
})

function roundish(n, d) {
  d = d || 0;
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

console.log('Average manager load: ' + roundish(reportsTotal / managers.length, 2));
console.log('Median manager load: ' + reportsArray[Math.round(reportsArray.length / 2)]);

var numICs = (staff.length - managers.length);
console.log('Mozilla is ' + roundish(managers.length/staff.length * 100, 2) + '% managers')
console.log(managers.length + " Managers vs " + numICs + ' ICs, or a ' + roundish(numICs / managers.length, 2) + ':1 ratio');
