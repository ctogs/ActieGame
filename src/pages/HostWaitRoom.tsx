import { useEffect, useState } from "react"
import { Player } from "../helpers/types"
import { collection, doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { setStartGameToTrue } from "../helpers/database";

export function HostWaitRoom() {
  const navigate = useNavigate();
  const URLparams = useParams();
  const gameRoomsRef = collection(db, 'gameRooms')
  const roomID = URLparams.roomID
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        setPlayers(docData.players)
      }
    })

    return () => {
      unsub();
    }
  }, [])

  const startGame = async() => {
    if (roomID != undefined) console.log("no room")
    await setStartGameToTrue(gameRoomsRef, roomID)
    navigate(`/host/${roomID}`);
  }
  return (
    <> 
      <h1>Waiting Room</h1>
      {Object.entries(players).map(([key, value]) => 
         (
          <div key={key} className="actie-header">
            <div className="player-name">
              {value.displayName}
            </div>
          </div>
        )
      )} <br />     
      <button onClick={startGame}>start game</button>
    </>
  )
}