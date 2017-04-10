var MYJSON = require('./json.js');
var assert = require('assert');

var objCheck = function (testCase) {
  var string = JSON.stringify(testCase);
  assert.deepEqual(MYJSON.parse(string), testCase);
};

var strCheck = function (string) {
  var shouldBe;
  try {
    shouldBe = JSON.parse(string);
  } catch (e) {
    throw new Error ("invalid test case" + string);
  }
  assert.deepEqual(MYJSON.parse(string), shouldBe);
}

var strCheckShouldFail = function (string) {
  try {
    MYJSON.parse(string);
  } catch (e) {
    return; 
  }
  throw new Error('test should fail');
}

objCheck(1);
objCheck(12);
objCheck(123423);
objCheck(123423.4);
objCheck(-123423.4);
strCheckShouldFail("");
strCheck("null");
strCheck("true");
strCheck("false");
strCheck("\"\"");
strCheck("\"a\"");
strCheck("\"bla-bla-bla\"");
strCheck("\"bla\\\"-bla-bla\"");
objCheck(null);
objCheck(false);
objCheck(true);
objCheck("zzzdwerw");
objCheck("wqe\\qwer");
objCheck("wqe\"rqwer");
objCheck("wqe\\rqwer");
objCheck("wqe\\\"rqwer");
objCheck("wqe\\\\\"rqwer");
objCheck("wqe\\\\rqwer");
objCheck({});
objCheck([]);
objCheck(["234"]);
objCheck(["234", "567"]);
objCheck(["234", "567", null, false]);
objCheck(["234", "567", null, false]);
objCheck([true, "234", "567", null, false]);
objCheck([[]]);
objCheck([1, 3, "sss"]);
objCheck([[[[]]]]);
objCheck([{}])
objCheck({});
objCheck({a: "b"});
objCheck({a: 5});
objCheck({a: 5, b: null});
objCheck({a: "b", d: null});
objCheck({a: "b", d: null, e: []});
objCheck({a: "b", d: null, e: [{}]});
strCheck("[ ]");
strCheck("[  ]");
strCheck("[   ]");
strCheck("[\n]");
strCheck("[\n\tnull ]");
strCheck("[\n\t\"sdf\" , \"zzz\" ]");
strCheck("{}");
strCheck("{ }");
strCheck("{   }");
strCheck("{\"a\" : \"b\"   }");
strCheck("{\"a\" : \"b\" , \"c\": null   }");
