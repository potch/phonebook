var latestOrg = require('./phonebook.json');

function process(org) {
  org.lookup = org.staff.reduce(function (obj, cur) {
    obj[cur.dn] = cur;
    return obj;
  }, {});
  org.staff.forEach(function (e) {
    e.reports = [];
    org.staff.forEach(function (f) {
      if (e.manager && e.manager.dn === f.dn) {
        e.manager.obj = f;
      }
      if (f.manager && f.manager.dn == e.dn) {
        e.reports.push(f);
      }
    });
  });
  return org;
}

function findByEmail(username) {
  for (var i=0; i < org.staff.length; i++) {
    if (org.staff[i].dn.indexOf('mail=' + username + '@mozilla.com,') > -1) {
      return org.staff[i];
    }
  }
}

var org = process(latestOrg);

function depthMap(e) {
  var total = [1];

  function count(f, d) {
    if (!total[d]) {
      total[d] = 1;
    } else {
      total[d]+= f.length;
    }
    if (d > 7) return;
    f.forEach(function(g) {
      if (g !== e) {
        count(g.reports, d + 1);
      }
    });
  }

  count(e.reports, 1);

  return total;
}

console.log(depthMap(findByEmail('chris')));
