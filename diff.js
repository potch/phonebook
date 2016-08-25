var oldOrg = require('./phonebook.20160507.json');
var latestOrg = require('./phonebook.json');

oldDate = new Date(oldOrg.timestamp);
latestDate = new Date(latestOrg.timestamp);

function process(org) {
  org.lookup = org.staff.reduce(function (obj, cur) {
    obj[cur.dn] = cur;
    return obj;
  }, {});
  org.staff.forEach(function (e) {
    e.reports = 0;
    org.staff.forEach(function (f) {
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

var latest = process(latestOrg).staff;
var old = process(oldOrg).staff;
old = old.filter(function (e) {
  if (e.employeetype[1] && e.employeetype[1].match(/intern/i)) {
    return false;
  }
  if (e.title && e.title.match(/intern/i)) {
    return false;
  }
  return true;
});

latest = latest.filter(function (e) {
  if (e.employeetype[1] && e.employeetype[1].match(/intern/i)) {
    return false;
  }
  if (e.title && e.title.match(/intern/i)) {
    return false;
  }
  return true;
});

console.log('# Org changes from ' + oldDate + ' to ' + latestDate);

var departures = [];
var hires = [];
var moves = [];
var reports = [];
var exist = {};

old.forEach(function (e) {
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
    if (depth > 8) {
      console.error('whoa', e.cn);
    }
    if (e.manager && depth > 0) {
      map[depth-1]++;
      count++;
      total += depth;
    }
    if (logit && depth === 2) {
      // console.error(e.cn);
    }
  });
  console.error(total, count);
  map.push(total/count);
  return map;
}

function getDepartments(org) {
  var map = {};
  org.forEach(function (e) {
    var dept = e.deptname;
    if (dept) {
      dept = dept.replace(/\(.+\)/g, '');
      if (dept instanceof Array) {
        dept = dept[0];
      }
      if (!(dept in map)) {
        map[dept] = 0;
      }
      map[dept]++;
    }
  });
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

function histogram(a, b) {
  var largest = 0;
  var maxDepth = Math.max(a.length, b.length);
  for (var i = 1; i < maxDepth; i++) {
    largest = Math.max(Math.max(a[i], b[i]), largest);
  }
  var out = '';
  for (i = 1; i < maxDepth; i++) {
    out += bar(a[i], largest, '#a44');
    console.error(a[i], b[i]);
    out += bar(b[i], largest, '#44a');
  }
  return out;
}

function bar(num, basis, color) {
  console.error(num, basis);
  return '<div style="width:' + (num/basis*100) + '%;height: 20px;background:' + color + ';"></div>\n';
}

var oldDepth = depthMap(old);
var newDepth = depthMap(latest, true);

var oldLocations = getLocations(old);
var newLocations = getLocations(latest);

var oldDepts = getDepartments(old);
var newDepts = getDepartments(latest);

oldDepth.unshift(oldDate);
newDepth.unshift(latestDate);

function lastNameCompare(n) {
  return function (a, b) {
    var na = a[n].trim().split(/\s+/).pop() || '';
    var nb = b[n].trim().split(/\s+/).pop() || '';
    return nb < na ? 1 : -1;
  };
}

function bucketDiff(bucketA, bucketB) {
  var rows = [];
  for (var o in bucketA) {
    var row = [o, bucketA[o], 0, 0];
    if (o in bucketB) {
      row[2] = bucketB[o];
      row[3] = row[2] - row[1];
    }
    rows.push(row);
  }
  for (var o in bucketB) {
    if (!(o in bucketA)) {
      var row = [o, 0, bucketB[o], bucketB[o]];
      rows.push(row);
    }
  }
  return rows.sort(function (a, b) {
    return a[2] > b[2] ? -1 : 1;
  });
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

console.log('\n## Departments\n');

console.log('Name | Old Staff | New Staff | Change \n --- | --- | --- | ---');
console.log(bucketDiff(oldDepts, newDepts).map(td).join('\n'));

console.log('\n## Depth\n');

console.log('Date | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Average \n --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---');
console.log(td(oldDepth));
console.log(td(newDepth));

console.log(histogram(oldDepth, newDepth));

console.log('\n## Location');
console.log('Location | Old # | New # | Change \n --- | --- | --- | ---');
console.log(bucketDiff(oldLocations, newLocations).map(td).join('\n'));
