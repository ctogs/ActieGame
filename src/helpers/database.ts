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
  console.log(userdbID)
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