import { useEffect, useRef, useState } from "react"
import { Player } from "../helpers/types"
import { collection, doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { WaitingRoom } from "./WaitingRoom";
import { setStartGameToTrue } from "../helpers/database";

export function HostWaitRoom() {
  const navigate = useNavigate();
  const URLparams = useParams();
  const gameRoomsRef = collection(db, 'gameRooms')
  const roomID = URLparams.roomID

  const startGame = async() => {
    if (roomID != undefined) console.log("no room")
    await setStartGameToTrue(gameRoomsRef, roomID)
    navigate(`/host/${roomID}`);
  }
  return (
    <> 
      <WaitingRoom />
      <button onClick={startGame}>start game</button>
    </>
  )
}