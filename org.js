var org = require('./phonebook.json');

date = new Date(org.timestamp);

function process(org) {
  org = org.filter(function (e) {
    return e.employeetype[1] !== 'Intern';
  });
  org.forEach(function (e) {
    e.reports = 0;
    e.directs = [];
    org.forEach(function (f) {
      if (e.manager && e.manager.dn === f.dn) {
        e.manager.obj = f;
      }
      if (f.manager && f.manager.dn == e.dn) {
        e.reports++;
        e.directs.push(f);
      }
    });
  });
  org.forEach(function (e) {
    e.totalReports = 0;
    var seen = {};
    function count(r) {
      if (seen[r.dn]) {
        return;
      }
      seen[r.dn] = true;
      e.totalReports++;
      r.directs.forEach(count);
    }
    e.directs.forEach(count);
  });
  return org;
}

function iso(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).substr(-2) + '-' + ('0' + d.getDate()).substr(-2);
}
date = iso(date);

var chart = process(org.staff);

console.log('# Org chart analysis');

var departures = [];
var reports = [];

chart.forEach(function (e) {
  if (e.employeetype[1] === 'Intern') {
    return;
  }
  if (e.reports) {
    reports.push([e.cn, e.reports, e.totalReports]);
  }
});

function bullet(s) {
  return '* ' + s;
}

function td(a) {
  return a.join(' | ');
}

function depthMap(org) {
  var map = [0,0,0,0,0,0,0,0,0];
  var count = 0;
  var total = 0;
  org.forEach(function (e) {
    var depth = 0;
    var chain = [];
    var p = e;
    while (p.manager && p.manager.obj && chain.indexOf(p.dn) === -1) {
      depth++;
      chain.push(p.dn);
      p = p.manager.obj;
    }
    if (e.manager && depth > 0) {
      map[depth-1]++;
      count++;
      total += depth;
    }
  });
  map.push(Math.floor(total / count * 100) / 100);
  return map;
}

var mv = [];
function getLocations(org) {
  var map = {};
  org.forEach(function (e) {
    var office = e.workdaylocation || e.physicaldeliveryofficename;
    if (office) {
      if (office instanceof Array) {
        office = office[0];
      }
      if (office === 'Mountain View Office') {
        mv.push(e.cn);
      }
      if (!(office in map)) {
        map[office] = 0;
      }
      map[office]++;
    }
  });
  return map;
}

var newDepth = depthMap(chart);

var locations = getLocations(chart);

newDepth.unshift(date);

function lastNameCompare(a, b) {
  var na = a.trim().split(/\s+/).pop().toLowerCase() || '';
  var nb = b.trim().split(/\s+/).pop().toLowerCase() || '';
  return nb < na ? 1 : -1;
}

console.log('\n## Managers\n');

console.log('Name | Directs | Reports \n --- | --- | ---');
console.log(reports.sort(function (a,b) {
  return b[1] - a[1];
}).map(td).join('\n'));

console.log('\n## Depth\n');

console.log('Date | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Average \n --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---');
console.log(td(newDepth));

console.log('\n## Location');
console.log('Location | # \n --- | ---');
var rows = [];
for (var o in locations) {
  var row = [o, locations[o]];
  rows.push(row);
}
console.log(rows.sort(function (a, b) {
  return a[1] > b[1] ? -1 : 1;
}).map(td).join('\n'));

console.error(mv.sort(lastNameCompare).join('\n'));
