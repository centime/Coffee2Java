min = (a, b) ->
    return a if a<b
    return b


valeurs =  [ 4, 18, 32, 3, 12, 2, 7]

mini = valeurs[0]

for i in [0..6]
    val = valeurs[i]
    alert val
    mini = min( mini, val )

alert ''
alert 'minimum :'
alert mini
