var coffee  = require('coffee-script');
var esprima = require('esprima');
var fs = require('fs')

function readFile(path, callback){
    fs.readFile(path, 'utf8', function (err,data) {
            if (err) { return console.log(err); }
            callback(data, path);
        });
}

function writeFile(data, path){
    fs.writeFile(path, data, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('File saved : '+path);
        }
    }); 
}

process.argv.splice(2).forEach(function (arg, index, array) {
        readFile(arg, function (data, path) {
            
            console.log( index+': '+path );

            
            
            var cofAst = coffee.nodes( data);
            var jsCode = coffee.compile( data ) ;
            var jsAst = esprima.parse( jsCode );
            jsAst = jsAst.body[0].expression.callee.object.body ;
            
            console.log(cofAst.toString() );


            var jsPath = path.split('.coffee')[0]+'.js';
            var jsAstPath = path.split('.coffee')[0]+'.jast';
            var cofAstPath = path.split('.coffee')[0]+'.cast';
            
            writeFile( JSON.stringify( cofAst, null, 2), cofAstPath );
            writeFile( JSON.stringify( jsAst, null, 2), jsAstPath );
            writeFile( jsCode, jsPath );
            
            }
        );
    });

