
import { supabase, AI, TMDB_KEY } from './config.js';
import podcasts  from './content.js';




const group1 = document.getElementById("genre");
const group2 = document.getElementById('mood');
const submitBtn = document.getElementById('submitBtn');
const introPage = document.getElementById('intro');
const startBtn = document.getElementById("start");
const nextPage = document.getElementById('block');
const headerImage = document.getElementById('popcorn')

const movie_display = document.getElementById('movie_display');
const movie_title = document.getElementById('movie_title');
const movie_image = document.getElementById('movie_image');
const movie_description = document.getElementById('movie_description')
const finalButton = document.getElementById('finalButton');
const getheader = document.getElementById('header');
let pageCounter = 0;
let movement = 1;
let cachedReccomendations = [];





group1.addEventListener('click', e => {
    if(e.target.classList.contains('option') ){
        
        group1.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
    }
    else{
        e.target.id= '';
    }
});

group2.addEventListener('click', e => {
    if(e.target.classList.contains('option')){
        group2.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
    }
    else{
        e.target.id = '';
    }
});



startBtn.addEventListener("click", () => {
    
    const object = getIntroData();
    if(object.People === '' || object.Time == ''){
        alert('Please enter a value for both questions');

    }
    else{
        introPage.style.display = 'none';
        nextPage.style.display = 'flex';

    }
    

})

function createContext(){
    const intro = getIntroData();
    const secondPage = getSelectedOptions();

    return {...intro, ...secondPage};

}

function getIntroData(){
    
    const time = document.getElementById('time');
    

   return {  
  Time: time.value ? `I have ${time.value}` : ''
};
}

function getSelectedOptions(){
    const selected1 =  group1.querySelector('.selected.option');
    const selected2 = group2.querySelector('.selected.option');
    const favoriteMovie = document.getElementById('favorite');

    return {
    Genre: selected1 ? `I would like to watch a  ${selected1.textContent} film` : "Classic or new, I don't mind either",
    Mood: selected2 ? `I am in the mood for something ${selected2.textContent}` : 'I am open to any type of movie',
    Favourite: favoriteMovie.value ? `I would like to talk about my favourite film next. ${favoriteMovie.value}` : ''
  };
}

async function getData(data){
    const messages = [{
        role: 'system',
        content: 'You are an esteemed film expert that showcases their expertise through movie reccomendations to people. Your job is having been given context and the corresponding movie reccomendation, write a short paragraph (under 50 words) outlining why the movie is suitable for that context. If context is not given say you do not have enought information please do not make things up. If you do not agree with a recommendation given provide a positive paragraph anyway.'
    },
    {

        role: 'user', 
        content: data
    }]

    const result = await AI.chat.completions.create({
        model: 'gpt-4', 
        messages: messages
     })

      const text = result.choices[0].message.content;
      return text;
}


async function createEmbedding(input) {
  if (typeof input !== 'string') {
    throw new Error("Input to createEmbedding must be a string");
  }

  const embeddingResponse = await AI.embeddings.create({
    model: "text-embedding-ada-002",
    input
  });

  return embeddingResponse.data[0].embedding;
}


async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 5
  });
  
  
  
  return data;
}

/*
const embedding = await createEmbedding('I like barbie');
const data = await findNearestMatch(embedding)
console.log(data);

*/

async function main(){
    const data = createContext();
    const stringData = Object.values(data).join(' ')
    const embedding = await createEmbedding(stringData);
    const response = await findNearestMatch(embedding);
    const chatbotResponses = await Promise.all(
  response.map(async (movie) => {
    const completeContext = {
      ...data,
      Recommendation: `The recommended movie for this individual is: ${movie.title}`,
      Overview: movie.overview
    };

    const contextString = Object.values(completeContext).join('\n');
    const chatResponse = await getData(contextString);

    return {
      movie,
      chatResponse
    };
  })
);

return chatbotResponses;
}

async function fetchMovies(movieName){
    
let found = false;
let page = 1;
const cleanMovieName = movieName.toLowerCase().trim();

  while (!found && page <= 10) { 
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(movieName)}&page=${page}`);
    const data = await res.json();

    for (const movie of data.results) {
      if (movie.original_title.toLowerCase() === cleanMovieName) {
        found = true;
        return movie;
      }
    }
    page++;
  }

  if (!found) {
    console.log("Movie not found in first 15 pages.");
    return null;

  }


}




submitBtn.addEventListener("click", async function() {
    nextPage.style.display = 'none';
    showSpinner();
    try {
        cachedReccomendations = await main();
        console.log(cachedReccomendations);
        const movie = await fetchMovies(cachedReccomendations[0].movie.title);
        console.log(movie);
        makePage(movie, cachedReccomendations[0].chatResponse);
    } catch (err) {
        console.error("Error during recommendation flow:", err);
    } finally {
        hideSpinner();
        headerImage.src = '';
    }
});

async function storeData(movies) {
  const data = await Promise.all(
    movies.map(async (movie) => {
      const title = movie.title?.trim() || "Untitled";
      const overview = movie.content?.trim() || "No description provided.";
      const releaseYear = movie.releaseYear?.trim() || '';

      const fullText = `${title}. ${overview}`;

      const embeddingResponse = await AI.embeddings.create({
        model: "text-embedding-ada-002",
        input: fullText
      });

      return {
        title,
        overview,
        releaseYear,
        content: fullText, 
        embedding: embeddingResponse.data[0].embedding
      };
    })
  );

  const { error } = await supabase
    .from("documents")
    .insert(data);
    

  if (error) {
    console.error("Supabase insert error:", error);
  } else {
    console.log("Embedding and storing complete!");
  }
}

function makePage(movie,  chatResponse){
    getheader.style.display = 'none';
    movie_display.style.display = 'flex';

    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    movie_title.textContent = `${movie.original_title} (${year})`;
    movie_image.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    movie_description.textContent = chatResponse;
    finalButton.style.display = 'block';
    
    
}

function showSpinner() {
  document.getElementById('loadingSpinner').style.display = 'block';
}

function hideSpinner() {
  document.getElementById('loadingSpinner').style.display = 'none';
}


finalButton.addEventListener('click', async function () {
  if (cachedReccomendations.length === 0) return;
    finalButton.disabled = true;
  showSpinner();
  try {
    pageCounter += movement;

    if (pageCounter < 0) pageCounter = 0;
    if (pageCounter >= cachedReccomendations.length) pageCounter = cachedReccomendations.length - 1;

    const movie = await fetchMovies(cachedReccomendations[pageCounter].movie.title);
    makePage(movie, cachedReccomendations[pageCounter].chatResponse);

    
    if (pageCounter === cachedReccomendations.length - 1) {
      finalButton.textContent = 'Previous Movie';
      movement = -1;
    } else if (pageCounter === 0 && movement === -1) {
      finalButton.textContent = 'Next Movie';
      movement = 1;
    }

  } catch (err) {
    console.error("Error fetching movie:", err);
  } finally {
    finalButton.disabled = false;
    hideSpinner();
  }
});




