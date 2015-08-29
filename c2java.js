var coffee = require('coffee-script');
var esprima = require('esprima');
var fs = require('fs')
var coffee2var = require('./c2var.js')

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

function upperFirstLetter(string){return string.charAt(0).toUpperCase() + string.slice(1);}
function lowerFirstLetter(string){return string.charAt(0).toLowerCase() + string.slice(1);}

function ast2java ( name, ast, varidentifiers ){
        var i, index = 3, indent = 2, javaCode =[];


        javaCode[0]='package '+lowerFirstLetter(name)+' ;';
        javaCode[1]='public class '+upperFirstLetter(name)+' {';
        javaCode[2]='    public static void main( String args[] ) {';
        javaCode[3]='    }';
        javaCode[4]='}';

        for (i in ast.body) {
            javaCode.splice(index, 0, getIndent(indent)+processAst(ast.body[i], varidentifiers, indent) +';');
            index++;
        }
//        console.log(' aaaaaaaaaaaaaaaaaaaa\n'+JSON.stringify(varidentifiers, null, 2) );
        for (i in ast.body) {
            javaCode.splice(index+1, 0, getIndent(indent)+processAstFunc(ast.body[i], varidentifiers, indent));
            index++;
        }

        return javaCode.join('\n') ;
}



function processAst( ast, identifiers, indent, varname, bool ){
    var line = ''; 
        
//    console.log('youhoui: '+ast.type+' '+ast.name+' '+JSON.stringify( identifiers, null, 2));


    switch ( ast.type ) {

        case 'Identifier' :
           return replace( ast.name, equivalents);

        case 'Literal' :
            var type ;//= guessType( ast.value ); 
            if ( !(varname === undefined ) ){
                type = identifiers[varname].type ;
                if (type == 'array') type = identifiers[varname].objectType;
            }
            if ( !(bool === undefined ) ){
                type = 'Boolean' ;
            }
            switch (type) {
                case 'float' : return ast.value ;
                case 'int' : return ast.value ;
                case 'String' : return '"'+ast.value+'"';
                case 'Boolean' : return ast.value;
                default : 
                    if ( isNumber(ast.value) ) return ast.value;
                    else return '"'+ast.value+'"';    
                    break ;
            }

        case 'MemberExpression' :
            return processAst( ast.object, identifiers, indent )+'['+processAst(ast.property, identifiers, indent)+']';


        case 'ExpressionStatement' :
            return processAst( ast.expression, identifiers, indent ) ;

        case 'SequenceExpression' :
            var i, expressions = [];
            for (i in ast.expressions) expressions[i] = processAst( ast.expressions[i], identifiers, indent );
            return expressions.join(',');

        case 'VariableDeclaration' :
            var variable;
            for (var i in ast.declarations) {
                variable = ast.declarations[i].id.name;
                // variable _i, _j,.. _len, _len1 from coffee->js
                if ( variable.match(/^_..?$/) != null ){  identifiers[variable] = {} ; identifiers[variable].type = 'int';};
                if ( variable.match(/^_len.?.?$/) != null ){ identifiers[variable] = {}; identifiers[variable].type = 'int';};
                if ( variable.match(/^_ref.?.?$/) != null ){identifiers[variable] = {}; identifiers[variable].type = 'array'; identifiers[variable].objectType = 'String';};
                if ( identifiers[variable].type == 'function' ) line += ''
                else if ( identifiers[variable].type == 'array' ) line += identifiers[variable].objectType+'[] '+variable+' ;'
                else line += identifiers[variable].type +' '+ variable + ' ; ';
            }
            return line ;

        case 'AssignmentExpression' :
            var  name = ast.left.name ;
           
            // fixed var from coffee-> js transpilation (for loops)
            if ( name.match(/^_len.?.?$/) != null ) return name+' = '+ast.right.object.name+'.length';
            if ( name.match(/^_..?$/) != null ) return name+' = '+ast.right.value;
            //array
            if ( ast.left.type == 'MemberExpression' ){
                name = processAst( ast.left, identifiers, indent).split('[')[0];
            }
            if ( !( identifiers[name] === undefined)) if ( identifiers[name].type == 'function') {
                
                return line ;

            }else{
                switch ( ast.right.type ) {
                    case 'Literal' : 
                        //sends the var name to the literal for adjusting format
                        if ( !(name == undefined ))return processAst( ast.left )+ast.operator+processAst( ast.right, identifiers, indent, name );
                        return processAst( ast.left )+ast.operator+processAst( ast.right, identifiers );

                    case 'Identifier' : 
                        if ( identifiers[name].type != identifiers[ast.right.name].type ) {
                            console.log('transtyping not supported : '+name+ast.operator+ast.right.operator);
                            process.exit(1);
                        };
                        return processAst( ast.left, identifiers )+ast.operator+processAst( ast.right, identifiers );

                    case 'ArrayExpression' :
                        var i, entries = [];
                        line += name+' = new '+identifiers[name].objectType+'[] { ';
                        for (i in ast.right.elements){
                            entries[i]= processAst( ast.right.elements[i], identifiers, indent, name );
                        };
                        line += entries.join(', ') + '}';
                        return line ;

                    case 'CallExpression' :

                        var funcName = ast.right.callee.name, params = [];
                        identifiers[funcName].funcArgTypes = [];
                        for (i in ast.right.arguments) {
                            console.log('jjj   '+ ast.right.arguments[i].name );   
                                        
                            if( !(identifiers[ast.right.arguments[i].name] === undefined )) {
                                identifiers[funcName].funcArgTypes[i] = identifiers[ast.right.arguments[i].name].type ;
                                if ( !(ast.right.arguments[i].name === undefined)) params[i] = ast.right.arguments[i].name
                                else if ( !(ast.right.arguments[i].value === undefined)) params[i] = ast.right.arguments[i].value
                                else if ( !(ast.right.arguments[i].val === undefined)) params[i] = ast.right.arguments[i].val
    /* a tester */                            else {console.log('Weak functions implementation, sorry. Unable to manage type parameter'); process.exit(0);}
                            }else {} ;
                        }

//                        ast.right.callee.name+'( '+params.join(', ')+') ';
                        return processAst( ast.left, identifiers )+ast.operator+processAst( ast.right, identifiers );
                        break;

                    
                    default : 
                        return processAst( ast.left, identifiers )+ast.operator+processAst( ast.right, identifiers );
                };
                
            };
        
        case 'CallExpression' :
            line += processAst( ast.callee, identifiers, indent )+'( ';
            var args=[];
            for (var i in ast.arguments) args[i]= processAst( ast.arguments[i], identifiers, indent );
            line += args.join(',')+' )' ;
            return line ;

        case 'BinaryExpression' :
            var operator = ast.operator;
            switch (operator){
                case '===' : operator = '==';
                             break;
                case '!==' : operator = '!=';
                             break;
                default : break;
            };
            return '('+processAst( ast.left , identifiers, indent)+operator+processAst( ast.right, identifiers, indent )+')' ;

        case 'UnaryExpression' : 
            return ast.operator+processAst(ast.argument, identifiers, indent) ;

        case 'IfStatement' :
            line = 'if ('+processAst( ast.test , identifiers, indent)+')\n'+processAst( ast.consequent, identifiers, indent )
            if (ast.alternate != null) line+=processAst( ast.alternate, identifiers, indent);
            return line;

        case 'LogicalExpression' :
                if (ast.left.type == 'Identifier' && ast.right.type == 'Identifier') { 
                    if ( identifiers[ast.left.name].type != identifiers[ast.right.name].type ) {
                        console.log('transtyping not supported : '+ast.left.name+ast.operator+ast.right.operator);
                        process.exit(1);
                    };
                }
            return '('+processAst( ast.left, identifiers, indent, ast.right.name, 1 )+ast.operator+processAst( ast.right, identifiers, indent, ast.left.name, 1 )+')';

        case 'BlockStatement' :
            var blockCode = [], index = 1, indentBloc = getIndent(indent);
            blockCode[0]=indentBloc+'{';
            blockCode[1]=indentBloc+'}';

            indentBloc = getIndent(indent+1) ;

            for (i in ast.body) {
       //         if ( ast.body[i].type === 'ReturnStatement' ) break ;
                blockCode.splice(index, 0, indentBloc+processAst(ast.body[i], identifiers, indent+1) +';');
                index++;
            }

            return blockCode.join('\n') ;

        case 'ForStatement' :
            if ( !(ast.update.right === undefined )){ 
                // for i in [1..10]
                var previousIncrement = ast.init.left.name, newIncrement = ast.init.right.left.name ;   
                replaceIdentifier( ast.body, previousIncrement, newIncrement );
                line = 'for ('+ processAst( ast.init.right, identifiers, indent )
                    +' ; '+ processAst( ast.test, identifiers, indent )
                    +' ; '+ processAst( ast.update.right, identifiers, indent )
                    +')\n'+processAst( ast.body, identifiers, indent);
            }else{
                // for increment in iterable
                line = 'for ('+ processAst( ast.init, identifiers, indent )
                    +' ; '+ processAst( ast.test, identifiers, indent )
                    +' ; '+ processAst( ast.update, identifiers, indent )
                    +')\n'+processAst( ast.body, identifiers, indent );
            };
            return line ;

        case 'UpdateExpression' :
            return processAst(ast.argument, identifiers, indent)+ast.operator ;

        case 'WhileStatement' :
            line = 'while ( '+processAst( ast.test, identifiers, indent )+' )\n'
                +processAst( ast.body, identifiers, indent);
            return line ;
        
        case 'ReturnStatement' :
            var returnIdentifier = ast.argument.name ;
            if ( ast.argument.type === 'CallExpression' ) line += processAst( ast.argument, identifiers, indent)
            else line += 'return( '+ast.argument.name+' )';
            return line;

        default :
            console.log('\n********************************** ERROR ******************************\n\
                    Unknown expression type : '+ast.type+'\n\
**************************************************************************');

                    



    };

}

function processAstFunc( ast, identifiers, indent, inFunction){
    var line = '', i;
            
    switch ( ast.type ) {

        case 'Identifier' :
            if ( !(inFunction === undefined) ){
                line += ast.name ;
            }
            break ;

        case 'Literal' :
            if ( !(inFunction === undefined) ){
                var type = guessType( ast.value , identifiers );
                switch ( type ){
                    case 'String' : line += '"'+ast.value+'"';
                                    break ;
                    default : line += ast.value ;
                              break ;
                };
            };
            break ;
        

        case 'MemberExpression' :
            line += processAstFunc( ast.object, identifiers, indent, inFunction );
            line +=  processAstFunc(ast.property, identifiers, indent, inFunction);
            break ; 


        case 'ExpressionStatement' :
                line += processAstFunc( ast.expression, identifiers, indent, inFunction ) ;
            break ; 

        case 'SequenceExpression' :
            for (i in ast.expressions) line += processAstFunc( ast.expressions[i], identifiers, indent, inFunction );
            break ; 

        case 'AssignmentExpression' :
            var  name = ast.left.name, argName, index = 1, returnType ;
            if ( !(identifiers[name] === undefined)) if ( identifiers[name].type == 'function') {
                
                identifiers[name].innerIdentifiers = {};
                for (i in ast.right.params){
                    argName = ast.right.params[i].name;
                    identifiers[name].innerIdentifiers[argName] = {};
                    if ( !(identifiers[name].funcArgTypes === undefined )) identifiers[name].innerIdentifiers[argName].type = identifiers[name].funcArgTypes[i];
                }
                
                for (i in ast.right.body.body){
                    if (ast.right.body.body[i].type == 'ReturnStatement' ){
                        if ( !(identifiers[name].innerIdentifiers[ast.right.body.body[i].argument.name] === undefined )) returnType = identifiers[name].innerIdentifiers[ast.right.body.body[i].argument.name].type
                        else returnType = 'void';
                        if (identifiers[name].returnType == undefined ) identifiers[name].returnType = returnType 
                        else if ( identifiers[name].returnType != returnType ){
                            console.log('Only one return type per function type pliz'); process.exit(0);}
                    }
                } if (returnType === undefined ) returnType = 'void';

                line += 'public static '+returnType+' '+ name +'( ';

                    /* function declaration parameters */
                if ( !(identifiers[name].funcArgTypes === undefined)){
                    var params = [];
                    for (i in ast.right.params) params[i] = identifiers[name].funcArgTypes[i]+' '+processAstFunc( ast.right.params[i],identifiers, indent, name );        
                    line += params.join(',');
                 };
                line +=' )\n';
                line += processAst( ast.right.body, identifiers[name].innerIdentifiers, indent);

            };
            break ; 
        
        case 'BlockStatement' :
            if ( !(inFunction === undefined) ){

                line += getIndent(indent)+'{\n';
                for (i in ast.body) line += getIndent(indent+1)+processAstFunc(ast.body[i], identifiers, indent+1, inFunction)+' ;\n';
                line += getIndent(indent)+'}\n';


            }else for (i in ast.body) line += processAstFunc(ast.body[i], identifiers, indent) ;
            break ; 

        case 'ReturnStatement' :
            var returnIdentifier = ast.argument.name ;
                if ( ast.argument.type === 'CallExpression' ) {
                    line += processAstFunc( ast.argument, identifiers, indent, inFunction )
                    identifiers[inFunction].returnType = 'void';
                    //returnType = returnType of returned function                    identifiers[inFunction].returnType = identifiers[.returnType
                
                }else{
                    line += 'return( '+ast.argument.name+' )';
                    identifiers[inFunction].returnType = identifiers[inFunction].innerIdentifiers[returnIdentifier].type ;

                }
                break;

        case 'CallExpression' :
                if ( !(inFunction === undefined) ){
                    line += replace( ast.callee.name, equivalents ) +'( ';
                    var arguments = [];
                    for (i in ast.arguments) arguments[i] = processAstFunc( ast.arguments[i], identifiers, indent, inFunction )
                    arguments.join(';') + ' )';

                   
                }else for (i in ast.arguments) line += processAstFunc( ast.arguments[i], identifiers, indent, inFunction );
                break ;


        case 'BinaryExpression' :
            line += processAstFunc( ast.left , identifiers, indent, inFunction) ;
            line += processAstFunc( ast.right, identifiers, indent, inFunction ) ;
            break ; 

        case 'UnaryExpression' : 
            line += processAstFunc(ast.argument, identifiers, indent, inFunction) ;
            break ; 

        case 'IfStatement' :
            line += processAstFunc( ast.test , identifiers, indent, inFunction);
            line += processAstFunc( ast.consequent, identifiers, indent, inFunction ) ;
            if (ast.alternate != null) line += processAstFunc( ast.alternate, identifiers, indent, inFunction);
            break ; 
            

        case 'LogicalExpression' :
            line += processAstFunc( ast.right , identifiers, indent, inFunction);
            line += processAstFunc( ast.left , identifiers, indent, inFunction);
            break ; 

        case 'ForStatement' :
            line += processAstFunc( ast.init, identifiers, indent, inFunction ) ;
            line += processAstFunc( ast.test, identifiers, indent, inFunction );
            line += processAstFunc( ast.update, identifiers, indent, inFunction );
            line += processAstFunc( ast.body, identifiers, indent , inFunction);
            break ; 

        case 'UpdateExpression' :
            line +='//'+ processAstFunc(ast.argument, identifiers, indent, inFunction)+ast.operator ;
            break ; 

        case 'WhileStatement' :
            line += processAstFunc( ast.test, identifiers, indent , inFunction);
            line += processAstFunc( ast.body, identifiers, indent, inFunction);
            break ; 

        default : break ;
    };

    return line;

    
}
                
function replaceIdentifier( ast, previousId, newId){
    var i ;

    switch ( ast.type ) {

        case 'Identifier' :
            if ( ast.name == previousId ) ast.name = newId ;
            break ;
        case 'Literal' :
            break ;
        
        case 'CallExpression' :
            replaceIdentifier( ast.callee, previousId, newId );
            for (i in ast.arguments) replaceIdentifier( ast.arguments[i], previousId, newId );
            break ; 

        case 'MemberExpression' :
            replaceIdentifier( ast.object, previousId, newId );
            replaceIdentifier(ast.property, previousId, newId);
            break ; 


        case 'ExpressionStatement' :
            replaceIdentifier( ast.expression, previousId, newId ) ;
            break ; 

        case 'SequenceExpression' :
            for (i in ast.expressions) replaceIdentifier( ast.expressions[i], previousId, newId );
            break ; 

        case 'AssignmentExpression' :
            replaceIdentifier( ast.left, previousId, newId) ;
            replaceIdentifier( ast.right, previousId, newId) ;
            break ; 
            

        case 'BinaryExpression' :
            replaceIdentifier( ast.left , previousId, newId) ;
            replaceIdentifier( ast.right, previousId, newId ) ;
            break ; 

        case 'UnaryExpression' : 
            replaceIdentifier(ast.argument, previousId, newId) ;
            break ; 

        case 'IfStatement' :
            replaceIdentifier( ast.test , previousId, newId);
            replaceIdentifier( ast.consequent, previousId, newId ) ;
            if (ast.alternate != null) replaceIdentifier( ast.alternate, previousId, newId);
            break ; 
            

        case 'LogicalExpression' :
            replaceIdentifier( ast.right , previousId, newId);
            replaceIdentifier( ast.left , previousId, newId);
            break ; 

        case 'BlockStatement' :
            for (i in ast.body) replaceIdentifier(ast.body[i], previousId, newId) ;
            break ; 


        case 'ForStatement' :
            replaceIdentifier( ast.init, previousId, newId ) ;
            replaceIdentifier( ast.test, previousId, newId );
            replaceIdentifier( ast.update, previousId, newId );
            replaceIdentifier( ast.body, previousId, newId );
            break ; 

        case 'UpdateExpression' :
            replaceIdentifier(ast.argument, previousId, newId)+ast.operator ;
            break ; 

        case 'WhileStatement' :
            replaceIdentifier( ast.test, previousId, newId );
            replaceIdentifier( ast.body, previousId, newId);
            break ; 
    };

    
}
function guessType(value ){
    if ( isNumber( value ) )  return 'float';
    if ( value === 'true' || value === 'false' ) return 'Boolean' // 'true' & 'false' ?
    return 'String' ;
}


function getIndent(n){var ind='',i; for (i=0; i<n;i++){ind+='    '}; return ind};

function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
}

function replace( identifier, equivalents ){
    if ( identifier in equivalents )  return equivalents[identifier] ;
    return identifier ;
}

var equivalents = {
    "alert" : "System.out.println",
    "console.log" : "System.out.println",
};


var typeNumber = 'int';
//var typeNumber = 'float';

process.argv.splice(2).forEach(function (arg, index, array) {
        readFile(arg, function (data, path) {
           var name, jsCode, jsAst, javaCode, javaPath, identifiersList = {};  

            name = path.split('.coffee')[0].split('/').slice(-1)[0]; 

            jsCode = coffee.compile( data ) ;
            jsAst = esprima.parse( jsCode );
            jsAst = jsAst.body[0].expression.callee.object.body ;


            //coffeescript AST crawler : finds all variables / identifiers
            coffee2var.getIdentifiers(data, identifiersList, typeNumber);
            console.log(JSON.stringify(identifiersList, null ,2));
            
            javaCode = ast2java( name, jsAst, identifiersList ) ;

            console.log( index+': '+path+'\n' );
            console.log(javaCode);
            javaPath = upperFirstLetter(name)+'.java'; 
            writeFile( javaCode, javaPath );
           
            
            }
        );
    });

