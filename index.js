#! /usr/bin/env node

var prompt = require('prompt');
var fs = require('fs');
var path = require('path');
var request = require('request');
var chalk = require('chalk');
var opts = require("nomnom").parse();

var bookPath = path.join(__dirname, 'phonebook.json');
var d = new Date();
var dstring = d.getFullYear().toString() + ('0' + (d.getMonth() + 1)).substr(-2) + ('0' + (d.getDate() + 1)).substr(-2);
var todayPath = path.join(__dirname, 'phonebook.' + dstring + '.json');

var query = opts._.join(' ');

var book;

fs.readFile(bookPath, function (error, data) {
  try {
    book = JSON.parse(data);
    if (error) {
      console.log(error);
      noData();
    } else {
      start();
    }
  } catch (e) {
    console.log(e);
    noData();
  }
});

function start() {
  if (query) {
    searchPeople(query);
  } else {
    interactive();
  }
}

function interactive() {
  prompt.message = 'phonebook';
  prompt.start();
  console.log('loaded ' + book.count + ' records');
  console.log('last updated ' + ((Date.now() - book.timestamp) / 36e5 | 0) + ' hours ago');
  showprompt();
}

function handlePrompt(err, cmd) {
  if (err) {
    console.log(err);
    return;
  }
  cmd = cmd.phonebook;
  if (cmd[0] === '!') {
    parts = cmd.split(/\s+/);
    cmd = parts[0];
    switch (cmd) {
      case '!update':
        startUpdate();
        return;
        break;
      case '!more':
        searchPeople(parts[1], {more: true});
        break;
      case '!q':
        process.exit(0);
        break;
    }
    showprompt();
  } else {
    searchPeople(cmd);
    showprompt();
  }
}

function updateData(err, result) {
  if (err) {
    showprompt();
    return;
  }
  var username = result.username;
  var password = result.password;
  request.get({
    url: 'https://phonebook.mozilla.org/search.php?query=*&format=json',
    auth: {
        'user': username,
        'pass': password,
        'sendImmediately': false
      }
    }, function (error, response, body) {
      mode = 'normal';
      if (error) {
        console.log('error fetching data: ' + error);
        showprompt();
        return;
      }

      try {
        var staff = JSON.parse(body);
        book = {
          staff: staff,
          count: staff.length,
          timestamp: Date.now()
        };
        console.error('loaded ' + book.count + ' records');
        fs.writeFile(todayPath, JSON.stringify(book, null, 2));
        fs.writeFile(bookPath, JSON.stringify(book, null, 2), function (error) {
          if (error) {
            console.log('error writing data!');
          }
          showprompt();
        });
      } catch (e) {
        console.log('error fetching data: malformed');
        showprompt();
      }
  });
}

function noData() {
  console.log('error loading data! Please sign in to update.');
  startUpdate();
}

function startUpdate() {
  prompt.get({
    properties: {
      username: {
        required: true
      },
      password: {
        hidden: true,
        required: true
      }
    }
  }, updateData);
}

function searchPeople(query, options) {
  options = options || {};
  var found = 0;

  book.staff.forEach(function (person) {
    if (stringInObj(person, query)) {
      console.log('');
      printCard(person, options);
      found++;
    }
  });
  console.log('');
  console.log(found + (found === 1 ? ' person found' : ' people found.'));
}

function printCard(person, options) {
  var keys = Object.keys(person).sort();
  var special = 'cn mail im mobile bugzillaemail title emailalias workdaylocation';
  keys = keys.filter(function (k) {
    return !(special.indexOf(k) !== -1);
  });
  console.log(chalk.bold(person.cn));
  if (person.title) console.log(chalk.yellow(person.title));
  if (person.emailalias) console.log(chalk.cyan(person.emailalias));
  if (person.bugzillaemail) console.log(chalk.cyan(person.bugzillaemail) + ' (bugzilla)');
  if (person.mail && person.mail !== person.bugzillaemail) console.log(chalk.cyan(person.mail));
  if (person.workdaycostcenter) console.log(person.workdaycostcenter);
  if (person.workdaylocation) console.log(person.workdaylocation);
  if (person.mobile) console.log(person.mobile.join('\n'));
  if (person.im) console.log(person.im.join('\n'));

  if (options.more) {
    keys.forEach(function (k) {
      console.log(chalk.gray(k) + ': ' + person[k]);
    });
  }
}

function stringInObj(o, s) {
  s = s.toLowerCase();
  for (var p in o) {
    var v = o[p];
    if (typeof v === 'string' && v.toLowerCase().indexOf(s) !== -1) {
      return true;
    }
    if (typeof v === 'object') {
      if (stringInObj(v, s)) {
        return true;
      }
    }
  }
  return false;
}

function showprompt() {
  prompt.get('phonebook', handlePrompt);
}
