node c2java.js $1.coffee ;
javac -d . $2.java ;
java $1.$2 ;
