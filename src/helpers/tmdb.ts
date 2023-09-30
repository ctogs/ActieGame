import { Round } from "./types";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = "http://api.themoviedb.org/3/"
const EDIT_URL = "person/3/movie_credits&"
const API_URL = BASE_URL + EDIT_URL + API_KEY;
const IMAGE_URL = "https://image.tmdb.org/t/p/original"

function movieOnly(item: any) {
  if (item.known_for_department !== "Acting") return false

  for (const media of item.known_for) {
    if (media.media_type !== "movie" || media.original_language !== "en") return false
  }

  return true
}


export async function generateRound() {
  const page = Math.floor(Math.random() * 13) + 1

  const ares = await fetch("https://api.themoviedb.org/3/person/popular?language=en-US&page=" + page + "&" + API_KEY);

  const ajson = await ares.json();
  const dData = ajson.results.filter(movieOnly)

  const len = dData.length
  const randNum = Math.floor(Math.random() * len)
  const randMov = Math.floor(Math.random() * 3)
  const movieID = dData[randNum].known_for[randMov].id
  const firstActorName = dData[randNum].name

  // Get Actor1 Image
  const actor1Id = dData[randNum].id
  const actor1Image = await fetch("https://api.themoviedb.org/3/person/" + actor1Id + "/images?language=en-US&" + API_KEY)
  const actor1ImageJson = await actor1Image.json()
  const actor1ImageArray = actor1ImageJson.profiles
  // Load all images into an array
  const actor1ImageListArray = []
  for (const image of actor1ImageArray) {
    actor1ImageListArray.push(IMAGE_URL + image.file_path)
  }
  if (actor1ImageListArray.length == 0) {
    actor1ImageListArray.push("https://static.wikia.nocookie.net/mycun-the-movie/images/c/c9/Bob_%28Despicable_Me%29.png/revision/latest?cb=20230509144510")
  }

  const actor1ImageURL = actor1ImageListArray[0]

  const credRes = await fetch('https://api.themoviedb.org/3/movie/'+ movieID + '/credits?language=en-US&' + API_KEY)
  const credJson = await credRes.json()
  const cast = credJson.cast.slice(0, 4).filter((item: any) => item.name !== firstActorName)

  const actor2 = cast[Math.floor(Math.random() * 3)];
 
  // Get other actor Image
  const actor2Id = actor2.id
  const actor2Image = await fetch("https://api.themoviedb.org/3/person/" + actor2Id + "/images?language=en-US&" + API_KEY)
  const actor2ImageJson = await actor2Image.json()
  const actor2ImageArray = actor2ImageJson.profiles
  // Load all images into an array
  const actor2ImageListArray = []
  for (const image of actor2ImageArray) {
    actor2ImageListArray.push(IMAGE_URL + image.file_path)
  }
  if (actor2ImageListArray.length == 0) {
    actor2ImageListArray.push("https://static.wikia.nocookie.net/mycun-the-movie/images/c/c9/Bob_%28Despicable_Me%29.png/revision/latest?cb=20230509144510")
  }

  const actor2ImageURL = actor2ImageListArray[0]

  // Movie Matching
  const movieList1 = await fetch("https://api.themoviedb.org/3/person/" + actor1Id + "/movie_credits?language=en-US&" + API_KEY)
  const movieList1Json = await movieList1.json();
  const movieCast1 = movieList1Json.cast
  const movieListArray1 = []
  for (const movie of movieCast1) {
    movieListArray1.push(movie.original_title)
  }

  // Get list of movies for actor 2
  const movieList2 = await fetch('https://api.themoviedb.org/3/person/' + actor2Id + '/movie_credits' + "?language=en-US&" + API_KEY)
  const movieList2Json = await movieList2.json();
  const movieCast2 = movieList2Json.cast
  // Insert actor's 2 movies into an array
  const movieListArray2 = []
  for (const movie of movieCast2) {
    movieListArray2.push(movie.original_title)
  }
  
  // Create an array with both actor's like movies
  const moviesShared = []
  const movieSet1 = new Set(movieListArray1)
  for (const element of movieListArray2)
  {
    if(movieSet1.has(element))
    {
      moviesShared.push(element)
    }
  }

  const gameRound: Round = {
    actor1Name: dData[randNum].name,
    actor2Name: actor2.name,
    actor1Image: actor1ImageURL,
    actor2Image: actor2ImageURL,
    movies: moviesShared
  }


  return gameRound
}