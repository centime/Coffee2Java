# Coffee2Java
old (2012) project of coffeescript (subset) to java transpilling.

# usage :
    libs : 

        npm install esprima
        npm install coffee-script

    transpilation coffee -> java

        node c2java.js [ path to files ]
    
    generation des AST ( filename.jast et filename.cast )

        node c2asts.js [ path to files ]

# exemples conseilles :

    weekEnd.coffee
    mini.coffee

# types handling :

    number -> int / float
    string -> String
    boolean -> Boolean
    array -> int array[], string array[], boolean array[]

# expressions handling :

    variable assignations
    binary operations
    unary operations
    logical expressions
    if statements
    while loops 
        a = 0 ; while a<3 (a must be assigned before usage)
    
    for loops 
        for i in [1..10] (integer only)
        iterable = ['a','b','c'] ; for i in iterable  (iterable assigned before usage)
        for l in ['a','g','h'] (inline iterable assignation, Strings only)

    functions
        /!\ weak implementation really, use it carefully
        . in case of identifier = function( param[] ), identifier must have been assigned before (like identifier = 0, '' etc
        . return may only be one variable, but also must be one given as parameter !
        . no function as function parameter


