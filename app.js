$(document).ready(function(){
    // Fetches random recipe
    $('button.btnRandomRecipe').on('click', function(){
        fetchMeal('r');

        // Textual updates
        $('#dynamicTitle').text('The Random Recipe');
    });

    // Fetch latest recipe
    $('.btnLatestRecipe').on('click', function(){
        fetchMeal('l');
    });

    // Fetch searched recipe
    $('.btnSearchRecipe').on('click', function(){
        fetchMeal('u');
    })

    //also this could be easily refactored, maybe open issue for this too

    // Fetch content after 3s
    setTimeout(getData(['u', 'r']), 1000);
});

// Get recipe list based on search input
$(document).keypress(function(e) {
    if( e.which == 13 && $.trim($('#searchRecipe').val()) !== '' ) {
        fetchMeal('u');
    }
});

// Show recipe of clicked meal
$(document).on('click','.mealCardRecipeBtn',function(){
    const meal = $(this).data('meal');
    window.scrollTo(0,$('#random').offset().top);
    createMeal(meal,'r');
    // Textual updates
    $('#dynamicTitle').text(meal.strMeal);
});

// Uses the fetch() API to request random meal recipe from TheMealsDB.com API
function fetchMeal(type){
    let url = '';
    if ( type === 'r') { url = 'https://www.themealdb.com/api/json/v1/1/random.php'; }
    else if ( type === 'l' ) { url = 'https://www.themealdb.com/api/json/v1/1/latest.php'; }

    if ( type === 'r' || type === 'l' ) {
        fetch(url)
        .then( res => res.json() )
        .then( res => {
            createMeal(res.meals[0], type);
            setCache(res.meals[0], type);
        })
        .catch( e => console.warn(e) );
    } else {
        fetch('https://www.themealdb.com/api/json/v1/1/search.php?s='+$.trim($('#searchRecipe').val()))
        .then( res => res.json() )
        .then( res => {
            createMealCards(res.meals);           
            window.scrollTo(0,$('#mealCardsSection').offset().top);
            $('#userInput').text($.trim($('#searchRecipe').val()));
            setCache(res.meals, type);
        })
        .catch( e => console.warn(e) );
    }
}

// Function to save the data in the cache
const setCache = (meal, type) => {
    let mealJson = JSON.stringify(meal);
    if( type === 'u' ){
        sessionStorage.setItem("search", $.trim($('#searchRecipe').val()));
        sessionStorage.setItem(type, mealJson);
    } else setCookie(type, mealJson);

}

// Function to set the cookie
const setCookie = (key, value, exDays = 3) => {
    let date = new Date();
    date.setTime(date.getTime() + exDays*24*60*60*1000);
    document.cookie = key + "=" + value + "; expires=" + date.toUTCString() + ";path=/";
}

// Function to get cookie
const getCookie = (key) => {
    key = key + "=";
    var cookies = document.cookie.split(';');
    for(var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      while (cookie.charAt(0) == ' ') cookie = cookie.substring(1);
      if (cookie.indexOf(key) == 0) { return cookie.substring(key.length, cookie.length) };
    }
    return null;
}

// Function to get cache data if it exists, otherwise, fetch from the API
const getData = (types) => {
    types.forEach(type => {
        if( type === "u" ) {
            let mealData = JSON.parse(sessionStorage.getItem(type));
            if( mealData !== null ) {
                createMealCards(mealData);           
                window.scrollTo(0,$('#mealCardsSection').offset().top);
                $('#userInput').text(sessionStorage.getItem("search"));
            }
        }
        else {
            let mealData = null;
            try {
                mealData = JSON.parse(getCookie(type));
            } catch (error) { console.warn(error) };
            mealData !== null ? createMeal(mealData, type) : fetchMeal(type);
        }
    })
}

// Function to generate the random meal UI component
const createMeal = (meal,type) => {
    // Set meal thumbnail
    setMealThumbnail(meal,type);

    let mealMetadata = '', mealInstr = '';

    // Fill meal name 
    if ( meal.strMeal ) { 
        mealMetadata = `<span>Name:</span> ${meal.strMeal} <br/>`
    }

    // Fill Area 
    if ( meal.strArea ) {
        mealMetadata += `<span>Area:</span> ${meal.strArea} <br/>`
    }

    // Fill category 
    if ( meal.strCategory ) {
        mealMetadata += `<span>Category:</span> ${meal.strCategory} <br/>`
    }

    // Format tags with comma-whitespace separator
    if ( meal.strTags ) {
        mealMetadata += `<span>Tags:</span> ${meal.strTags.split(',').join(', ')} <br/>`
    }

    // Set YouTube link
    if ( meal.strSource ) {
        mealMetadata +=`<span>YouTube:</span> <a href='${meal.strSource}' target="_blank" title="Watch how to cook ${meal.strMeal}">${meal.strSource}</a><br/>`
    }

    // Fill ingredients
    let ingredients = [];
    setIngredients(meal, ingredients);
    if ( ingredients.length > 0 ) {
        mealMetadata +=`<span>Ingredients:</span> <br/> <ul>${ingredients.join('')}</ul>`
    }

    // Set instructions
    if ( meal.strInstructions ) {
        mealInstr =`<span>Instructions:</span> <br/> ${meal.strInstructions}`
    }
    
    if ( type === 'r') { 
        $('#randomMealMetadata').html(mealMetadata); 
        $('#randomMealInstructions').html(mealInstr); 
    } else if ( type === 'l') { 
        $('#latestMealMetadata').html(mealMetadata); 
        $('#latestMealInstructions').html(mealInstr); 
    }
}

// Sets random meal's thumbnail image
const setMealThumbnail = (meal,type) => {
    let imgSrc = `<img src="${meal.strMealThumb}" alt="${meal.strMeal}" title="${meal.strMeal}" />`;
    if ( type === 'r') { $('#randomMealImg').html(imgSrc); }
    else if ( type === 'l') { $('#latestMealImg').html(imgSrc); }
}

// Gets ingredients of the random meal
const setIngredients = (meal,ingredients) => {   
    // API returns max. 20 ingredients
    for(let i = 1; i <= 20; i++){
        if(meal[`strIngredient${i}`]){
            ingredients.push(
                `<li>${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}</li>`
            );
        } else { break; }
        if ( i % 2 === 0 ) { ingredients.push('<br/>'); }
    }
}

// Creates meal cards based on search form
const createMealCards = meals => {
    let mealCards = '';

    meals.forEach(meal => {
        mealData = JSON.stringify(meal);
        mealData = mealData.replace(/(['])/g, "&rsquo;");
        mealCards += 
        `<div class="four columns"><div class="card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" title="${meal.strMeal}" class="u-max-full-width" />
            <div class="card-body">
                <div class="cardTitle">${meal.strMeal}</div>
                <button class="button mealCardRecipeBtn" data-meal='${mealData}'>Recipe</button>
            </div>
        </div></div>`;
    });
    $('.mealCards').html(mealCards);
    $('#mealCardsSection').show();
}