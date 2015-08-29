(function() {
  var i, j, l, lett, m, _i, _j, _k, _l, _len, _len1;

  lett = ['a', 'b'];

  for (i = _i = 0; _i <= 1; i = ++_i) {
    for (j = _j = 0; _j <= 1; j = ++_j) {
      alert(lett[i] + lett[j]);
    }
  }

  for (_k = 0, _len = lett.length; _k < _len; _k++) {
    l = lett[_k];
    for (_l = 0, _len1 = lett.length; _l < _len1; _l++) {
      m = lett[_l];
      alert(l + m);
    }
  }

}).call(this);
