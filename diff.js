var oldOrg = require('./phonebook.20150617.json');
var latestOrg = require('./phonebook.json');

oldDate = new Date(oldOrg.timestamp);
latestDate = new Date(latestOrg.timestamp);

function process(org) {
  org.forEach(function (e) {
    e.reports = 0;
    org.forEach(function (f) {
      if (e.manager && e.manager.dn === f.dn) {
        e.manager.obj = f;
      }
      if (f.manager && f.manager.dn == e.dn) {
        e.reports++;
      }
    });
  });
  return org;
}

function iso(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).substr(-2) + '-' + ('0' + d.getDate()).substr(-2);
}
oldDate = iso(oldDate);
latestDate = iso(latestDate);

var latest = process(latestOrg.staff);
var old = process(oldOrg.staff);

console.log('# Org changes from ' + oldDate + ' to ' + latestDate);

var departures = [];
var hires = [];
var moves = [];
var reports = [];
var exist = {};

old.forEach(function (e) {
  if (e.employeetype[1] === 'Intern') {
    return;
  }
  var f;
  exist[e.dn] = true;
  latest.forEach(function (t) {
    if (e.dn === t.dn) {
      f = t;
    }
  });
  if (!f) {
    departures.push([e.cn, e.deptname || '*none*', (e.manager && e.manager.cn) || '']);
  } else {
    if (e.reports !== f.reports) {
      reports.push([e.cn, e.reports, f.reports, f.reports - e.reports]);
    }
    if (e.manager && f.manager && e.manager.dn !== f.manager.dn) {
      moves.push([e.cn, e.manager.cn, f.manager.cn]);
    }
  }
});

latest.forEach(function (e) {
  if (e.employeetype[1] === 'Intern') {
    return;
  }
  if (!exist[e.dn]) {
    hires.push([e.cn, e.deptname || ' *none* ', (e.manager && e.manager.cn) || '']);
  }
});

function bullet(s) {
  return '* ' + s;
}

function td(a) {
  return a.join(' | ');
}

function depthMap(org, logit) {
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
    if (logit && depth === 2) {
      console.error(e.cn);
    }
  });
  console.error(total, count);
  map.push(total/count);
  return map;
}

function getLocations(org) {
  var map = {};
  org.forEach(function (e) {
    var office = e.workdaylocation || e.physicaldeliveryofficename;
    if (office) {
      if (office instanceof Array) {
        office = office[0];
      }
      if (!(office in map)) {
        map[office] = 0;
      }
      map[office]++;
    }
  });
  return map;
}

var oldDepth = depthMap(old);
var newDepth = depthMap(latest, true);

var oldLocations = getLocations(old);
var newLocations = getLocations(latest);

oldDepth.unshift(oldDate);
newDepth.unshift(latestDate);

function lastNameCompare(n) {
  return function (a, b) {
    var na = a[n].trim().split(/\s+/).pop() || '';
    var nb = b[n].trim().split(/\s+/).pop() || '';
    return nb < na ? 1 : -1;
  };
}

departures.sort(lastNameCompare(0));
hires.sort(lastNameCompare(0));
moves.sort(lastNameCompare(1));

console.log('\n## Departures (' + departures.length + ')\n');

console.log('Name | Department | Manager \n --- | --- | ---');
console.log(departures.map(td).join('\n'));

console.log('\n## Hires (' + hires.length + ')\n');

console.log('Name | Department | Manager \n --- | --- | ---');
console.log(hires.map(td).join('\n'));

console.log('\n## Moves (' + moves.length + ')\n');

console.log('Name | Old Manager | New Manager \n --- | --- | ---');
console.log(moves.map(td).join('\n'));

console.log('\n## Managers\n');

console.log('Name | Old Reports | New Reports | Change \n --- | --- | --- | ---');
console.log(reports.sort(function (a,b) {
  return b[3] - a[3];
}).map(td).join('\n'));

console.log('\n## Depth\n');

console.log('Date | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Average \n --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---');
console.log(td(oldDepth));
console.log(td(newDepth));

console.log('\n## Location');
console.log('Location | Old # | New # | Change \n --- | --- | --- | ---');
var rows = [];
for (var o in oldLocations) {
  var row = [o, oldLocations[o], 0, 0];
  if (o in newLocations) {
    row[2] = newLocations[o];
    row[3] = row[2] - row[1];
  }
  rows.push(row);
}
for (var o in newLocations) {
  if (!(o in oldLocations)) {
    var row = [o, 0, newLocations[o], newLocations[o]];
    rows.push(row);
  }
}
console.log(rows.sort(function (a, b) {
  return a[2] > b[2] ? -1 : 1;
}).map(td).join('\n'));
