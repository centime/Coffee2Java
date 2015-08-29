(function() {
  var a, b;

  a = 0;

  b = 1;

  while (a < 3) {
    a = a + 1;
    while (b < 3) {
      b = b + 1;
    }
  }

  alert(a);

}).call(this);
