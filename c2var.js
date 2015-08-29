var coffee  = require('coffee-script');

function crawlArray(ast, identifiers, node){
    var i, node, varName, varValue, varType ;
    switch (node) {
        case 'body' :
                for (i in ast.expressions){
                    crawlList(ast.expressions[i], identifiers );
                };
                break;
        case 'args' :

                break;
    };
};


function crawlList(ast, identifiers ){
    var i, keys, varName, varValue;
    key = Object.keys(ast)[0] ;
    switch ( key ) {
        case 'variable' : 
                
                varName = ast.variable.base.value ;

                if ( !( varName in identifiers )) identifiers[varName] = {};
    
                if ( !(ast.value.args === undefined )) {
                    // identifier = function( param[] ) : identifier must be already typed, and determines function's returnType
                    break;
                }
                
                if ( !(ast.value.params === undefined)) {
                    identifiers[varName].type = 'function';
                    identifiers[varName].funcArgTypes = [];

                }
                
                else if ( !(ast.value.operator === undefined)) identifiers[varName].type = crawlOperator( ast.value, identifiers ) 
                else if ( !(ast.value.base.body === undefined )) identifiers[varName].type = crawlOperator( ast.value.base.body.expressions[0], identifiers )
                else if ( !(ast.value.base.objects === undefined)){ getTypeArray(ast.value.base.objects, varName, identifiers ) }
                else if ( !(ast.value.base.property === undefined)){ getTypeList(ast, varName, identifiers ) }
                else{
                    if ( !(ast.value.base.val === undefined)) varValue = ast.value.base.val     
                    else varValue = ast.value.base.value ;
                    
                    if ( identifiers[varName].type === undefined ) identifiers[varName].type=getTypeFromValue( varValue, identifiers ) 
                    else if ( !( getTypeFromValue( varValue, identifiers ) == identifiers[varName].type ) ) {
                        console.log('Transtyping not supported, sorry !')
                        process.exit(code=0) ;
                    }
                };
                

                
                break ;
        case 'source' :

                var increment, iterableType, rangeStartType, rangeEndingType;
                if ( !(ast.source.base.value === undefined) ){
                    // for increment in iterable
                    increment = ast.name.value ;
                    iterableType = getTypeFromValue( ast.source.base.value, identifiers) ;
                    if ( !(increment in identifiers ) ) {
                        identifiers[increment] = {};
                        identifiers[increment].type = iterableType;
                    }else if ( identifiers[increment].type != iterableType ){console.log('No transtyping in loops neither..');process.exit(0);};
                }else if ( !(ast.source.base.objects === undefined) ){
                    // for increment in ['a','b']
                    var i;
                    increment = ast.name.value ;
                    iterableType = getTypeFromValue( ast.source.base.objects[0].base.value, identifiers) ;
                    for (i in ast.source.objects) if ( iterableType != getTypeFromValue( ast.source.base.objects[i].base.value, identifiers)){console.log('Iterable must of fixed type..'); process.exit(0); };
                    if ( !(increment in identifiers ) ) {
                        identifiers[increment] = {};
                        identifiers[increment].type = iterableType;
                    }else if ( identifiers[increment].type != iterableType ){console.log('No transtyping in loops neither..');process.exit(0);};
                }else if ( !(ast.source.base.from === undefined )){
                    //for i in [1..10]
                    increment = ast.name.value ;
                    rangeStartType = getTypeFromValue( ast.source.base.from.base.value, identifiers) ;
                    rangeEndingType = getTypeFromValue( ast.source.base.to.base.value, identifiers );
                    if ( rangeStartType != rangeEndingType){console.log('Interval must of fixed type..'); process.exit(0); };
                    if ( !(increment in identifiers ) ) {
                        identifiers[increment] = {};
                        identifiers[increment].type = rangeStartType;
                    }else if ( identifiers[increment].type != rangeStartType ){console.log('No transtyping in loops neither..');process.exit(0);};
                }
                crawlArray( ast.body, identifiers, 'body' )
                break;

        case 'body' :
                //new body bloc
                crawlArray( ast[key].expressions, identifiers, 'body' )
                break ;
        case 'args' :
                // arg bloc
                crawlArray( ast[key].expressions, identifiers, 'args' )
                break ;
    };

};

function crawlOperator( ast, identifiers ){
    var typeFirst, typeSecond ;
    
    //operator : go recursion
    if ( !(ast.operator === undefined)){
        typeFirst = crawlOperator( ast.first, identifiers );
        if ( !(ast.second === undefined )) typeSecond = crawlOperator( ast.second, identifiers );
    }else {
        if ( ast.first === undefined ) {
            if ( !(ast.base.body === undefined )) return crawlOperator( ast.base.body.expressions[0], identifiers )
            else if ( !(ast.base.value === undefined )) return getTypeFromValue( ast.base.value, identifiers )
            else return 'Boolean';
        }

        if ( !(ast.first.base.body === undefined )) typeFirst = crawlOperator( ast.first.base.body.expressions[0], identifiers )
        else if ( !(ast.first.base.value === undefined )) typeFirst = getTypeFromValue( ast.first.base.value, identifiers )
        else if ( !(ast.first.base.val === undefined )) typeFirst = 'Boolean' 
        
        if ( !(ast.second === undefined )){
            if ( !(ast.second.base.body === undefined )) typeSecond = crawlOperator( ast.second.base.body.expressions[0], identifiers )
            else if ( !(ast.second.base.value === undefined )) typeSecond = getTypeFromValue( ast.second.base.value, identifiers )
            else if ( !(ast.second.base.val === undefined )) typeSecond = 'Boolean' 
        }
    }

    if ( !(typeSecond === undefined) && (typeFirst != typeSecond) ) {console.log('Still no transtyping :/'); process.exit(0)}
    else { return typeFirst ;};
};


function getTypeList(name, identifiers){};
function getTypeArray(ast, name, identifiers){
// processAST ? array of arrays ?
    var i, objectType;
    if ( !(name in identifiers)) identifiers[name] = {};
    identifiers[name].type='array';
    objectType = getTypeFromValue( ast[0].base.value, identifiers );
    for (i in ast) if ( objectType != getTypeFromValue( ast[i].base.value, identifiers ) ){
        console.log('Array entries must be of the same type !');
        process.exit(0);
    }

    identifiers[name].objectType= objectType ; 
    
};

function getTypeFromValue( value, identifiers ){
    if ( value == "true" || value == "false" ) return('Boolean');
    if ( isNumber(value) ) return typeNumber; //'float';
    if ( value in identifiers ) {
        if (identifiers[value].type == 'array') return identifiers[value].objectType ;
        else{
            return identifiers[value].type;
        }
    };
    if ( value.charAt(0) === "'") return 'String';
}


function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
            
var typeNumber;

exports.getIdentifiers = function(data, identifiers, typeNum){
    typeNumber = typeNum ;
    var cofAst = coffee.nodes( data);
    identifiers = crawlArray(cofAst, identifiers, 'body');
}

