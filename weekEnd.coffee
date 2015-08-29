
isWeekEnd = (d, bool) ->
    bool = true if ( d == 'Samedi' or d =='Dimanche')
    return bool

week = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']


for day in week
    result = false
    result = isWeekEnd( day, result)
    alert day if result





