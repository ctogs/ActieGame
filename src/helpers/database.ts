import { generateRound } from "./tmdb";
import { GameRoom, Player, Round } from "./types";
// import { getRoundData } from "./getRound";
import * as xxhash from 'xxhash-wasm';
import { CollectionReference, DocumentData, doc, getDoc, getDocFromServer, setDoc, updateDoc } from "firebase/firestore";
import { User } from "@firebase/auth";

/**
 * Enter Room data into database
 */
export async function createGameRoom(
    gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
    user: User
  ) {
  // make unique roomID based on the date it was created
  const xxhashAPI = await xxhash.default();
  const timeNow = new Date().toISOString();
  const roomID = xxhashAPI.h64ToString(timeNow);
  
  const roundData = await generateRound();
  const gameRoomDoc = doc(gameRoomsRef, roomID);

  try {
    if (user.email) {
      await setDoc(gameRoomDoc, {
        start: false,
        roundEnd: false,
        actor1Name: roundData.actor1Name,
        actor2Name: roundData.actor2Name,
        actor1Image: roundData.actor1Image,
        actor2Image: roundData.actor2Image,
        movies: roundData.movies,
        roundWinner: "",
        correctRoundGuess: "",
        players: {
          [user.email] : {
            displayName: user.displayName,
            points: 0,
            host: true
          }
        }
      })
    } else {
      throw new Error("user email doesn't exist")
    }

  } catch (e) {
    console.log("couldn't add gameRoom to db");
    console.log(e)
  }

  return roomID;
}


/**
 * add users to the room in the database
 */
export async function addUser(
    usersRef: CollectionReference<DocumentData, DocumentData>,
    user: User,
    isHost: boolean
  ){
  // xxhash is deterministic
  const xxhashAPI = await xxhash.default();
  if (!user.email) return "No user email"

  const userdbID = xxhashAPI.h64ToString(user.email);

  const userDoc = doc(usersRef, userdbID);
  try {
    await setDoc(userDoc, {
      displayName: user.displayName,
      id: user.email,
      points: 0,
      host: isHost
    })
  } catch (e) {
    console.log("couldn't add user to db");
    console.log(e)
  }
}

/**
 * Add user to a room they're in. Adds that user the players list in the corresponding room doc
 */
export async function addUserToRoom(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  user: User,
  roomID: string
) {
  if (!user.email) return "No user email"
  const gameRoomDoc = doc(gameRoomsRef, roomID);


  const gameRoom = await getDoc(gameRoomDoc)
  const gameRoomData = gameRoom.data();
  
  if (!gameRoomData || gameRoomData.players == null){
    throw new Error("Game room data doesn't exist");
  } 
 
  const newPlayer: Player = {
    displayName: user.displayName,
    host: false,
    points: 0
  }
  
  gameRoomData.players[user.email] = newPlayer;
  const newPlayersRecord = gameRoomData.players;

  try {
    await updateDoc(gameRoomDoc, {
      players: newPlayersRecord
    })
  } catch (e) {
    console.log(e)
  }
}

/**
 * When the host hits "start game" in hostwaitroom, set start to true in the corresponding room doc
 */
export async function setStartGameToTrue(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  try {
    await updateDoc(gameRoomDoc, {
      start: true
    })
  } catch (e) {
    console.log("can't start game")
    console.log(e)
  }
}


/**
 * When a player or host guesses a movie correctly, make a new round with new data.
 * Alter the corresponding room doc with the new round data.
 */
export async function makeNewRound(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  const roundData = await generateRound();
  try {
    await updateDoc(gameRoomDoc, {
      actor1Name: roundData.actor1Name,
      actor2Name: roundData.actor2Name,
      actor1Image: roundData.actor1Image,
      actor2Image: roundData.actor2Image,
      movies: roundData.movies,
      roundEnd: false
    })
  } catch (e) {
    console.log("can't start game")
    console.log(e)
  }
}

/**
 * When a user or host guesses correctly, the host must end the round, setting roundEnd to true
 * in the corresponding room doc
 */
export async function endRound(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  try {
    await updateDoc(gameRoomDoc, {
      roundEnd: true
    })
  } catch (e) {
    console.log("can't start game")
    console.log(e)
  }
}

/**
 * When the number of rounds has passed the threshold, the host will end the game
 */
export async function endGame(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  try {
    await updateDoc(gameRoomDoc, {
      start: false
    })
  } catch (e) {
    console.log("can't start game")
    console.log(e)
  }
}

/**
 * When a player or the host guesses correctly, update the players list in the corresponding room doc with
 * the appropriate number of points they earned. It's the time remaining in the round * 10
 */
export async function updatePlayerPoints(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined,
  user: User,
  time: number
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  const gameRoom = await getDoc(gameRoomDoc)
  const gameRoomData = gameRoom.data();

  if (!gameRoomData || gameRoomData.players == null){
    throw new Error("Game room data doesn't exist");
  } 
  if (!user.email) throw new Error("user email doesn't exist")

  const updatedPlayer: Player = gameRoomData.players[user.email];
  updatedPlayer.points += time * 10;
  gameRoomData.players[user.email] = updatedPlayer;
  const updatedPlayersRecord = gameRoomData.players;

  try {
    await updateDoc(gameRoomDoc, {
      players: updatedPlayersRecord
    })
  } catch (e) {
    console.log(e)
  }
}

/**
 * Remove all special characters from the guess and the movie to get a better comparison.
 * MISSION impossible ghosT PROTOcol should be equivalent to Mission Impossible: Ghost Protocol
 */
export function isCorrectGuess(guess: string, movie: string) {
    // Remove special characters (keep digits)
    const removeSpecialChars = (input: string): string => {
      return input.replace(/[^a-zA-Z0-9]/g, '');
    };
  
    // Remove spaces and special characters, convert to lowercase
    const cleanString = (input: string): string => {
      let cleanedString = removeSpecialChars(input).toLowerCase();
      return cleanedString.replace("the", "")
    };
  
    // Clean and compare the strings
    const cleanedStr1 = cleanString(guess);
    const cleanedStr2 = cleanString(movie);
  
    return cleanedStr1 === cleanedStr2;
}

/**
 * When the host or player guesses correctly, update the corresponding room document with
 * their displayName as the round winner and their correct guess as the correctGuess.
 */
export async function updateRoundWinner(
  gameRoomsRef: CollectionReference<DocumentData, DocumentData>,
  roomID: string| undefined,
  displayName: string,
  correctGuess: string
) {
  const gameRoomDoc = doc(gameRoomsRef, roomID);
  
  try {
    await updateDoc(gameRoomDoc, {
      roundWinner: displayName,
      correctRoundGuess: correctGuess
    })
  } catch (e) {
    console.log("can't start game")
    console.log(e)
  }
}